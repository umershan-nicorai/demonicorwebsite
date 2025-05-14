'use client';

import React from 'react';

const AIBackgroundAnimation: React.FC = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        zIndex: -1
      }}
    />
  );
};

export default AIBackgroundAnimation; 