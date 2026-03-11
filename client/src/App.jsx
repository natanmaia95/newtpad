import { useState, useEffect, useCallback } from 'react'
import './App.css'
import io from 'socket.io-client';
import debounce from 'lodash.debounce'


const socket = io('http://localhost:3001');

function App() {
  const [text, setText] = useState('');

  const roomId = window.location.pathname; // e.g., "/my-secret-note"


  useEffect(() => {
    socket.emit('join-room', roomId);

    socket.on('receive-update', (newContent) => {
      console.log("content: ", newContent)
      if (newContent.text) setText(newContent.text);
    })

    return () => {
      socket.off('receive-update')
    };

  }, [roomId]);

  const debouncedTextUpdate = useCallback(
    debounce((newContent) => {
      socket.emit('text-update', { roomId, content: newContent })
    }, 500 //ms
  ), []);


  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    const newContent = { type: "full", text: val };
    debouncedTextUpdate(newContent);
    // 
    // socket.emit('text-update', { roomId, content: newContent });
  };


  return (
    <textarea 
      value={text} 
      onChange={handleChange} 
      style={{ width: '100vw', height: '100vh' }} 
    />
  )
}

export default App
