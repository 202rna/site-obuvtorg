import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function NoteDetailPage({ API_URL }) {
  const { id } = useParams(); // Вытаскивает note_id из URL строки
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchNote() {
      try {
        const response = await fetch(`${API_URL}/note/${id}`);
        const data = await response.json();
        if (response.ok) {
          setNote(data);
        } else {
          setError(data.detail || 'Заметка не найдена');
        }
      } catch {
        setError('Ошибка подключения к бэкенду');
      } finally {
        setLoading(false);
      }
    }
    fetchNote();
  }, [id, API_URL]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка заметки...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#ef4444' }}>{error}</div>;

  const styles = {
    container: { maxWidth: '800px', margin: '40px auto', padding: '0 24px', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' },
    backLink: { textDecoration: 'none', color: '#4f46e5', fontWeight: '600', display: 'inline-block', marginBottom: '24px' },
    card: { backgroundColor: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' },
    title: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', letterSpacing: '-0.5px' },
    desc: { fontSize: '16px', color: '#334155', lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '32px' },
    fileBox: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' },
    img: { maxWidth: '100%', maxHeight: '500px', borderRadius: '8px', marginTop: '12px', objectFit: 'contain' }
  };

  return (
    <div style={styles.container}>
      <Link to="/notes" style={styles.backLink}>← К списку заметок</Link>
      <div style={styles.card}>
        <h1 style={styles.title}>{note.title}</h1>
        <p style={styles.desc}>{note.description}</p>
        
        {note.image_url && (
          <div style={styles.fileBox}>
            <div style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>📎 Вложенный медиафайл / Документ:</div>
            <img src={note.image_url} alt="Вложенный файл" style={styles.img} />
          </div>
        )}
      </div>
    </div>
  );
}
