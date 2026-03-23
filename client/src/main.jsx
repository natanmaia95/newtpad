import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './routes/Home.jsx'
import { createBrowserRouter, redirect, RouterProvider } from 'react-router-dom'
import Note from './routes/Note.jsx'
import { isValidNotePath } from './utils/path.mjs'


function notePathLoader({ params }) {
    const { "*": splat } = params;
    if (!isValidNotePath(splat)) throw redirect('/');
    //remove trailing slashes
    if (splat.endsWith('/')) throw redirect(splat.slice(0, -1))
}


const router = createBrowserRouter([
    { path: '/', Component: Home },
    { path: '/*', loader: notePathLoader, Component: Note },

    { path: '*', loader: async () => redirect('/') }
])


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
