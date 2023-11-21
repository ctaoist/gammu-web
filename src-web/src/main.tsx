import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import Layout from './pages/_layout'
import '../dist/output.css'
// document.getElementsByTagName('html')[0].setAttribute('data-theme', 'light');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Layout />
  </BrowserRouter>
)

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <Layout />
//     </BrowserRouter>
//   </React.StrictMode>,
// )
