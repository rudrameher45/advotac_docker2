import Link from 'next/link';
import '../styles.css';
import './privacy.css';

export default function Privacy() {
  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span>Advotac</span>
          </div>
          <ul className="nav-menu">
            <li><Link href="/" className="nav-link">Home</Link></li>
            <li><Link href="/about" className="nav-link">About</Link></li>
            <li><Link href="/team" className="nav-link">Our Team</Link></li>
            <li><Link href="/solutions" className="nav-link">Solutions</Link></li>
            <li><Link href="/contact" className="nav-link">Contact Us</Link></li>
            <li><Link href="/privacy" className="nav-link active">Privacy Policy</Link></li>
          </ul>
          <Link href="/auth" className="nav-cta">Get Started</Link>
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Privacy Policy Content */}
      <section className="privacy-policy">
        <div className="container">
          <div className="privacy-header">
            <h1>Privacy Policy</h1>
            <p className="privacy-meta">
              <strong>Effective Date:</strong> January 1, 2024<br />
              <strong>Entity:</strong> Advotac Legal AI (&quot;Advotac,&quot; &quot;we,&quot; &quot;our,&quot; &quot;us&quot;)<br />
              <strong>Contact Email:</strong> <a href="mailto:advotac@gmail.com">advotac@gmail.com</a><br />
              <strong>Registered Address:</strong> Sambalpur, Odisha, India
            </p>
          </div>

          <div className="privacy-content">
            <section className="policy-section">
              <h2>1. Introduction</h2>
              <p>
                Advotac provides AI-powered legal research, drafting, and workflow tools for the Indian legal community. We understand the highly sensitive nature of legal data and are committed to safeguarding it. This Privacy Policy explains how we collect, process, store, disclose, and protect your data in compliance with the <strong>Digital Personal Data Protection Act, 2023 (India)</strong>, and where applicable, international standards such as the <strong>General Data Protection Regulation (GDPR)</strong>.
              </p>
              <p>
                By using Advotac, you consent to the practices described in this Policy. If you do not agree, please discontinue using our services.
              </p>
            </section>

            <section className="policy-section">
              <h2>2. Information We Collect</h2>
              <p>We collect only what is necessary for lawful business purposes:</p>
              
              <h3>2.1 Personal Information</h3>
              <ul>
                <li>Name, email address, phone number, organization, designation.</li>
                <li>Account credentials and authentication data.</li>
              </ul>

              <h3>2.2 Legal & Business Data</h3>
              <ul>
                <li>Case details, legal documents, filings, queries, contracts, drafts, and related content you upload or generate using Advotac.</li>
                <li>Metadata related to documents (timestamps, file size, formats).</li>
              </ul>

              <h3>2.3 Technical & Usage Data</h3>
              <ul>
                <li>IP address, device type, browser, operating system.</li>
                <li>Log files, clickstream data, activity tracking, and error reports.</li>
              </ul>

              <h3>2.4 Cookies & Tracking</h3>
              <p>We use cookies and tracking technologies for functionality, security, and analytics. Users can manage preferences through browser settings.</p>
            </section>

            <section className="policy-section">
              <h2>3. Lawful Basis for Processing</h2>
              <p>We process data only under lawful bases, including:</p>
              <ul>
                <li><strong>Consent:</strong> Where you explicitly provide consent.</li>
                <li><strong>Contractual Necessity:</strong> To deliver services you request.</li>
                <li><strong>Legal Obligation:</strong> To comply with statutory requirements.</li>
                <li><strong>Legitimate Interests:</strong> For improving services, preventing fraud, and ensuring security.</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>4. How We Use Information</h2>
              <ul>
                <li>Delivering AI-powered legal research, drafting, and workflow support.</li>
                <li>Improving accuracy, functionality, and security of our platform.</li>
                <li>Compliance with court orders, statutory obligations, and regulatory authorities.</li>
                <li>Conducting internal audits, monitoring, and dispute resolution.</li>
                <li>Limited anonymized usage for training and performance optimization (never in a way that identifies you or your clients).</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>5. Data Security</h2>
              <p>We adopt <strong>industry-standard safeguards</strong> to protect your data, including:</p>
              <ul>
                <li>End-to-end encryption (data at rest and in transit).</li>
                <li>Access restricted to authorized personnel under confidentiality obligations.</li>
                <li>Regular vulnerability testing, monitoring, and audits.</li>
                <li>Incident response protocols for potential breaches.</li>
              </ul>
              <p>Despite robust measures, no system is completely secure. By using Advotac, you acknowledge this inherent risk.</p>
            </section>

            <section className="policy-section">
              <h2>6. Data Sharing & Disclosure</h2>
              <p>We do <strong>not</strong> sell or rent user data. Disclosure may occur only:</p>
              <ul>
                <li>To comply with applicable law, regulation, or legal process.</li>
                <li>To trusted third-party vendors (e.g., hosting, analytics, security services) bound by strict confidentiality and data protection agreements.</li>
                <li>During a merger, acquisition, or restructuring, subject to equivalent privacy protections.</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>7. Data Retention</h2>
              <ul>
                <li>Personal and legal data is retained only as long as necessary for the purposes outlined or as mandated by Indian law.</li>
                <li>Users may request deletion, subject to statutory retention requirements.</li>
                <li>Anonymized or aggregated data may be retained indefinitely for analytics.</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>8. User Rights</h2>
              <p>As per the <strong>DPDP Act, 2023</strong>, you have rights to:</p>
              <ul>
                <li>Access your personal data.</li>
                <li>Correct inaccuracies.</li>
                <li>Withdraw consent.</li>
                <li>Request deletion (subject to legal obligations).</li>
                <li>File grievances with the <strong>Data Protection Board of India</strong> if unresolved.</li>
              </ul>
              <p>Requests can be submitted at <a href="mailto:advotac@gmail.com">advotac@gmail.com</a>.</p>
            </section>

            <section className="policy-section">
              <h2>9. Third-Party Services</h2>
              <p>Our platform may link or integrate with external services. We disclaim responsibility for their privacy practices, and users should review their policies independently.</p>
            </section>

            <section className="policy-section">
              <h2>10. Minors&apos; Data</h2>
              <p>Advotac is intended for legal professionals. We do not knowingly collect data from individuals under 18. If such data is discovered, it will be deleted promptly.</p>
            </section>

            <section className="policy-section">
              <h2>11. International Data Transfers</h2>
              <p>If data is transferred outside India, it will be subject to equivalent safeguards as required by law.</p>
            </section>

            <section className="policy-section">
              <h2>12. Liability Limitation</h2>
              <p>While we take maximum measures to safeguard data, <strong>Advotac shall not be liable for indirect, incidental, or consequential damages</strong> arising from unauthorized access, disclosure, or misuse of data, except where explicitly required under applicable law.</p>
            </section>

            <section className="policy-section">
              <h2>13. Updates to Policy</h2>
              <p>We may revise this Policy periodically. Updates will be effective upon posting with a revised &quot;Effective Date.&quot; Continued use after updates constitutes acceptance.</p>
            </section>

            <section className="policy-section">
              <h2>14. Contact Information</h2>
              <div className="contact-info">
                <p><strong>Advotac Legal Tech Pvt. Ltd.</strong></p>
                <p>Email: <a href="mailto:advotac@gmail.com">advotac@gmail.com</a></p>
                <p>Address: Sambalpur, Odisha, India</p>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Advotac</h3>
              <p>Revolutionizing legal practice with AI intelligence.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><a href="solutions.html">Solutions</a></li>
                <li><a href="contact.html">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>Email: <a href="mailto:advotac@gmail.com">advotac@gmail.com</a></p>
              <p>Sambalpur, Odisha, India</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Advotac Legal Tech Pvt. Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}