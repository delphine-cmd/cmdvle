import React from 'react';

import { FaPlus } from 'react-icons/fa';
import './MoreButton.css';

function MoreButton() {
  

  return (
    <button
      className="bottom-left-icon"
     
      type="button"
      aria-label="More options"
    >
      <FaPlus />
    </button>
  );
}

export default MoreButton;
