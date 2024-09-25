/** DO NOT EDIT */
/** USED BY DOCUSAURUS FOR DOCS */
import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function WelcomePage() {
  return (
    <Layout title="Welcome" description="Welcome to the App Boilerplate">
      <main style={{ textAlign: 'center', padding: '50px' }}>
        <h1>Welcome to the App Boilerplate 🚀</h1>
        <p>This boilerplate helps you kickstart your project efficiently.</p>
        <p>
          Please click on the <strong>Docs</strong> button in the navbar to
          access the documentation.
        </p>
        <Link to="/AddBackend" style={{ textDecoration: 'none' }}>
          <button
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#0078E7',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Go to Documentation
          </button>
        </Link>
      </main>
    </Layout>
  );
}
