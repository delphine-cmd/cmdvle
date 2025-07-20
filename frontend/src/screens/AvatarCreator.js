import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AvatarCreator = () => {
  const iframeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const parseJson = (data) => {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    };

    const handleMessage = async (event) => {
      const json = parseJson(event.data);
      if (!json || json.source !== 'readyplayerme') return;

      // ✅ Avatar exported successfully
      if (json.eventName === 'v1.avatar.exported') {
        const avatarUrl = json.data?.url;
        console.log('✅ Avatar URL:', avatarUrl);

        // ✅ Save to your backend
        await fetch('http://localhost:4000/api/student/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('gvle_token')}`,
          },
          body: JSON.stringify({ avatarUrl }),
        });

        // ✅ Redirect to student dashboard
        navigate('/student-dashboard');



      }

      // ✅ Optional: log session info
      if (json.eventName === 'v1.user.set') {
        console.log('✅ RPM User ID:', json.data?.id);
      }
    };

    window.addEventListener('message', handleMessage);

    iframe.onload = () => {
  const events = ['v1.avatar.exported', 'v1.user.set'];
  for (const eventName of events) {
    window.postMessage(
      JSON.stringify({
        target: 'readyplayerme',
        type: 'subscribe',
        eventName,
      }),
      '*'
    );
  }
};

    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: 'white',
      }}
    >
      <iframe
        ref={iframeRef}
        title="Student Avatar Creator"
        src="https://readyplayer.me/avatar?frameApi&guest=true"
        allow="camera *; microphone *"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      ></iframe>
    </div>
  );
};

export default AvatarCreator;
