/** DO NOT EDIT */
/** USED BY DOCUSAURUS FOR DOCS */
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function WelcomePage() {
  return (
    <Layout title="Welcome" description="SaleMate Documentation Home">
      <main style={{ textAlign: 'center', padding: '50px' }}>
        <h1>Welcome to "Product Name" Docs 📚</h1>
        <p>Your guide to getting started and mastering "Product Name".</p>
        <p>
          Use the <strong>Docs</strong> link in the navigation bar to explore
          all available guides and references.
        </p>
        <Link to="/welcome" style={{ textDecoration: 'none' }}>
          <button
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#FF5364',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Start Reading
          </button>
        </Link>
      </main>
    </Layout>
  );
}
