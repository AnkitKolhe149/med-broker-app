import "../styles/about.css";
import Navbar from "../components/Navbar";
import TeamCard from "../components/TeamCard";

const About = () => {
  return (
    <>
      <Navbar />

      <div className="about-page">
        {/* Header */}
        <section className="page-header fade-in">
          <h1>About Us</h1>
          <p className="subtitle">
            We are building an AI-driven pharmaceutical platform focused on
            transparency, efficiency, and global scalability.
          </p>
        </section>

        {/* Intro */}
        <section className="about-intro slide-up">
          <p>
            Our platform connects buyers and vendors across domestic and
            international markets. By leveraging intelligent automation,
            data-driven insights, and secure cloud infrastructure, we aim to
            simplify pharmaceutical trade while maintaining compliance and
            trust at scale.
          </p>
        </section>

        {/* Stats */}
        <section className="stats-section fade-in">
          <div className="stat">
            <h3>AI Powered</h3>
            <p>Smart recommendations & pricing intelligence</p>
          </div>
          <div className="stat">
            <h3>Global Reach</h3>
            <p>Domestic & international vendor onboarding</p>
          </div>
          <div className="stat">
            <h3>Secure by Design</h3>
            <p>Compliance-first cloud architecture</p>
          </div>
        </section>

        {/* Team */}
        <section className="team-section">
          <h2>Our Team</h2>

          <div className="team-grid">
            <TeamCard
              image="/team/ankit.jpg"
              name="Ankit Kolhe"
              role="Backend & System Architecture"
            />
            <TeamCard
              image="/team/amit.jpg"
              name="Amit Saw"
              role="Data & ML Engineering"
            />
            <TeamCard
              image="/team/poush.jpg"
              name="Poush Makade"
              role="Frontend UI"
            />
            <TeamCard
              image="/team/shubham.jpg"
              name="Shubham Tarwani"
              role="Frontend & UI Engineering"
            />
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section fade-in">
  <div>
    <h3>Get started with our platform</h3>
    <p>
      Buy medicines seamlessly or onboard as a trusted vendor and
      expand your reach.
    </p>
  </div>

  <div style={{ display: "flex", gap: "1rem" }}>
    <button>Shop Now</button>
    <button className="secondary-btn">Join as Vendor</button>
  </div>
</section>

      </div>
    </>
  );
};

export default About;
