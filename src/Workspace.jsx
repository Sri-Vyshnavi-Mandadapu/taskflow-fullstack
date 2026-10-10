import { useState } from 'react';
import App from './App';

export default function Workspace() {
  const [password, setPassword] = useState(() => sessionStorage.getItem('taskflow-access') || '');
  const [input, setInput] = useState('');
  function enter(event) {
    event.preventDefault();
    sessionStorage.setItem('taskflow-access', input);
    setPassword(input);
  }
  function logout() { sessionStorage.removeItem('taskflow-access'); setPassword(''); setInput(''); }
  if (password) return <App key={password} password={password} onLogout={logout} />;
  return <main className="workspace-login">
    <form className="modal" onSubmit={enter}>
      <p className="eyebrow">YOUR CONNECTED WORKSPACE</p>
      <h1>TaskFlow</h1>
      <p>Enter your workspace password to access your saved tasks.</p>
      <label>Workspace password
        <input type="password" autoComplete="current-password" required value={input} onChange={(event) => setInput(event.target.value)} />
      </label>
      <button type="submit" className="primary-button">Open workspace</button>
      <small>Your password stays in this browser tab until you sign out or close the tab.</small>
    </form>
  </main>;
}
