import { useState, useEffect, useCallback } from 'react'
import io from 'socket.io-client';
import { throttle } from 'lodash-es'



const socket = io('http://localhost:3001', {

});



export default function Note() {

    const [text, setText] = useState('');
    const roomId = window.location.pathname; // e.g., "/my-secret-note"

    

    useEffect(() => {
        socket.emit('join-room', roomId);

        socket.on('receive-update', (note) => {
            console.log("content: ", note)
            if (note.content || note.content === "") setText(note.content);
        })

        return () => {
            socket.off('receive-update')
        };

    }, [roomId]);



    // eslint-disable-next-line react-hooks/exhaustive-deps
    const throttledTextUpdate = useCallback(
        throttle((changes) => {
            socket.emit('text-update', { roomId, changes })
        }, 500
    ), [roomId]);



    const handleChange = (e) => {
        const val = e.target.value;
        setText(val);
        const changes = { type: "full", content: val };
        throttledTextUpdate(changes);
    };



    return (
        <textarea
            value={text}
            onChange={handleChange}
            // style={{ marginInline: 'auto', minHeight: '90vh' }}
            id="note-textarea"
        />
    )
}