import { useState } from "react";
import { isValidNotePath } from "../utils/path.mjs";
import { useNavigate } from "react-router-dom";






export default function Home() {
    const navigate = useNavigate();
    const [input, setInput] = useState('')



    const handleInputKeyDown = (event) => {
        console.log('a')
        if (event.key === 'Enter') {
            console.log('b')
            // pass;
            if (input == "") {
                console.log("Empty path!")
                return
            }
            if (!isValidNotePath(input)) {
                console.log("Invalid path!")
                setInput("")
                return
            }
            let finalPath = '/' + input;
            if (finalPath.endsWith('/')) finalPath.slice(0, -1)
            navigate(finalPath)
            
        }
    }



    return(
        <div>
            <h1>Hello World!</h1>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <h3>www.newtpad.com/</h3>
                
                <input 
                value={input} type="text"
                onChange={e => setInput(e.target.value)}
                style={{flexGrow: 1}} 
                onKeyDown={handleInputKeyDown}
                />
            </div>
        </div>
    )
}