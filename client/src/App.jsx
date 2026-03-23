import { useState, useEffect, useCallback } from 'react'
import './App.css'
import io from 'socket.io-client';
import { throttle } from 'lodash-es'


const socket = io('http://localhost:3001');

function App() {
  const [text, setText] = useState('');

  const roomId = window.location.pathname; // e.g., "/my-secret-note"


  useEffect(() => {
    socket.emit('join-room', roomId);

    socket.on('receive-update', (note) => {
      console.log("content: ", note)
      if (note.content || value === "") setText(note.content);
    })

    return () => {
      socket.off('receive-update')
    };

  }, [roomId]);

  const debouncedTextUpdate = useCallback(
    throttle((changes) => {
      socket.emit('text-update', { roomId, changes })
    }, 500 //ms
  ), []);


  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    const changes = { type: "full", content: val };
    debouncedTextUpdate(changes);
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
