import React, { useEffect, useState } from 'react';

interface EmailMessage {
  subject: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  receivedDateTime: string;
}

const EmailPage = () => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/emails/', {
      credentials: 'include', // VERY IMPORTANT for session auth
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch emails');
        }
        return res.json();
      })
      .then((data) => {
        setEmails(data.messages || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2> Your Emails</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && emails.length === 0 && <p>No emails found.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {emails.map((email, i) => (
          <li key={i} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
            <p><strong>Subject:</strong> {email.subject || '(No Subject)'}</p>
            <p><strong>From:</strong> {email.from?.emailAddress?.name} &lt;{email.from?.emailAddress?.address}&gt;</p>
            <p><strong>Received:</strong> {new Date(email.receivedDateTime).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmailPage;
