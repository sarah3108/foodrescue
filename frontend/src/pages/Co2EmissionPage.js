import React from 'react';

const extractNumber = (value) => {
  const match = String(value || '').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 1;
};

function Co2EmissionPage({ donations }) {
  const delivered = donations.filter((donation) => donation.status === 'delivered');
  const available = donations.filter((donation) => donation.status === 'available');
  const mealsRescued = delivered.reduce((sum, donation) => sum + extractNumber(donation.quantity), 0);
  const potentialMeals = available.reduce((sum, donation) => sum + extractNumber(donation.quantity), 0);
  const co2Saved = Math.round(mealsRescued * 2.5);
  const waterSaved = Math.round(mealsRescued * 58);
  const landfillAvoided = Math.round(mealsRescued * 0.42);
  const potentialCo2 = Math.round(potentialMeals * 2.5);

  return (
    <main className="feature-page">
      <section className="feature-hero co2-hero">
        <div>
          <p className="eyebrow">Impact tracker</p>
          <h1>CO2 emission savings from rescued food</h1>
          <p>
            Track the climate value of completed pickups and show donors how much impact
            the rescue board is creating.
          </p>
        </div>
        <div className="impact-meter">
          <span>{co2Saved} kg</span>
          <small>CO2 saved</small>
        </div>
      </section>

      <section className="feature-grid four-up" aria-label="Emission summary">
        <article className="feature-card">
          <span>{mealsRescued}</span>
          <h2>Meals rescued</h2>
          <p>Estimated from delivered donation quantities.</p>
        </article>
        <article className="feature-card">
          <span>{waterSaved} L</span>
          <h2>Water protected</h2>
          <p>A practical sustainability estimate for food saved from waste.</p>
        </article>
        <article className="feature-card">
          <span>{landfillAvoided} kg</span>
          <h2>Waste avoided</h2>
          <p>Completed pickups reduce organic waste entering landfill.</p>
        </article>
        <article className="feature-card">
          <span>{potentialCo2} kg</span>
          <h2>Still possible</h2>
          <p>Open donations that can still become climate savings.</p>
        </article>
      </section>

      <section className="split-panel">
        <div>
          <p className="eyebrow">How it is estimated</p>
          <h2>Simple project-ready calculation</h2>
          <p>
            Each rescued meal is estimated as 2.5 kg CO2 saved. The page uses live
            donation records, so new delivered pickups automatically improve the totals.
          </p>
        </div>
        <div className="bar-stack" aria-label="CO2 progress">
          <div>
            <span style={{ width: `${Math.min(100, co2Saved || 4)}%` }} />
            <strong>Completed impact</strong>
          </div>
          <div>
            <span style={{ width: `${Math.min(100, potentialCo2 || 4)}%` }} />
            <strong>Available potential</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Co2EmissionPage;
