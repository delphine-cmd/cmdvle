import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { FaSmile } from 'react-icons/fa';
import { RiSendPlane2Fill } from 'react-icons/ri';
import './Chat.css';

const Chat = ({
  roomId,
  bubbleId,
  userId,
  userName,
  role,
  token,
  scope = 'room',
  chatVisible,
  onUnreadCountChange,
}) => {

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // ✅ Added state
  const [typingUser, setTypingUser] = useState(null);


  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null); // ✅ THIS FIXES THE ERROR

  const roomKey = scope === 'bubble' ? `bubble-${bubbleId}` : `room-${roomId}`;




  useEffect(() => {
  const fetchMessages = async () => {
    try {
      const query = scope === 'bubble' ? `bubbleId=${bubbleId}` : `roomId=${roomId}`;
      const res = await fetch(`http://localhost:4000/api/messages?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setMessages(data.map(msg => ({
        ...msg,
        senderRole: msg.sender.role,
        senderId: msg.sender.id,
        senderName: msg.sender.name,
        })));

    } catch (error) {
      console.error('❌ Failed to load messages:', error);
    }
  };

  fetchMessages();
}, [roomId, bubbleId, scope, token]);

  // ✅ Connect to socket and handle messages
  useEffect(() => {
    socketRef.current = io('http://localhost:4000', {
      auth: { userId },
    });

    socketRef.current.emit('join-room', roomKey);

    socketRef.current.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    // ✅ Increment unread count if chat isn't visible
      if (!chatVisible) {
        setUnreadCount((prev) => {
          const newCount = prev + 1;
          onUnreadCountChange?.(newCount); // 🔔 notify parent
          return newCount;
        });
      }
    });

        socketRef.current.on('typing', (payload) => {
        console.log('📡 Typing event received:', payload);
        if (payload?.senderName) {
            setTypingUser(payload.senderName);
        }
        });


        socketRef.current.on('stop-typing', () => {
        setTypingUser(null);
        });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomKey, userId, chatVisible, onUnreadCountChange]); // ✅ updated dependencies

  // ✅ Auto scroll on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ✅ Reset unread count when chat opens
  useEffect(() => {
    if (chatVisible) {
      setUnreadCount(0);
      onUnreadCountChange?.(0); // ✅ also reset in parent
    }
  }, [chatVisible, onUnreadCountChange]);

  const sendMessage = async () => {
  if (text.trim()) {
    const message = {
      text,
      senderId: userId,
      roomId: scope === 'room' ? Number(roomId) : null,
      bubbleId: scope === 'bubble' ? Number(bubbleId) : null,
    };

    try {
      // ✅ 1. Save to DB
      const res = await fetch('http://localhost:4000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(message),
      });

      const savedMessage = await res.json();

      // ✅ 2. Emit via socket
socketRef.current.emit('message', {
  text: savedMessage.text,
  senderId: savedMessage.senderId,
  senderName: savedMessage.sender?.name || userName,
  timestamp: savedMessage.timestamp,
  roomKey,
});

      setText('');
      setShowEmojiPicker(false);
    } catch (err) {
      console.error('❌ Failed to send message:', err);
    }
  }
};

  const handleEmojiClick = (emojiData) => {
  console.log("Emoji Data:", emojiData);
  setText((prev) => prev + (emojiData.native || emojiData.emoji || ''));
};



  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


const groupMessagesByDate = (messages) => {
  const groups = {};
  messages.forEach((msg) => {
    const date = new Date(msg.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
  });
  return groups;
};

const groupedMessages = groupMessagesByDate(messages);


  return (
  <div className="chat-panel">
    <div className="chat-header">
      {typingUser ? `${typingUser} is typing...` : 'Chat'}
    </div>

    <div className="chat-messages">
      {Object.entries(groupedMessages).map(([date, msgs], groupIdx) => (
        <div key={groupIdx}>
          <div className="chat-date-divider">{date}</div>
          {msgs.map((msg, idx) => {
            const isMe = msg.senderId === userId;
            return (
              <div
                key={idx}
                className={`message-wrapper ${isMe ? 'me' : 'other'}`}
              >
                <div className="msg-box">
                  <strong>{isMe ? 'You' : msg.senderName}</strong>
                  <div>{msg.text}</div>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>

    {typingUser && (
      <div className="typing-indicator">{typingUser} is typing...</div>
    )}

    <div className="chat-input-area">
      <div className="input-with-emoji-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            socketRef.current.emit('typing', { roomKey, senderName: userName });
            clearTimeout(window.typingTimeout);
            window.typingTimeout = setTimeout(() => {
              socketRef.current.emit('stop-typing', { roomKey });
            }, 1000);

            // Dynamically grow input height
            const el = textareaRef.current;
            if (el) {
              el.style.height = 'auto';
              el.style.height = `${el.scrollHeight}px`;
            }
          }}
          rows={1}
          placeholder="Type a message..."
        />
        <button
          className="emoji-inside-button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          <FaSmile />
        </button>
      </div>

      <button className="send-button" onClick={sendMessage}>
        <RiSendPlane2Fill />
      </button>
    </div>

    {showEmojiPicker && (
      <div className="emoji-wrapper-below">
        <Picker
          data={data}
          onEmojiSelect={handleEmojiClick}
          theme="light"
          previewPosition="none"
          skinTonePosition="none"
        />
      </div>
    )}
  </div>
);
}

export default Chat;
