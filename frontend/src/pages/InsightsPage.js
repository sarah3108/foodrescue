import React, { useCallback, useEffect, useState } from 'react';

function InsightsPage({ apiUrl }) {
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/insights`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load insights');
      }
      setInsights(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <main className="feature-page">
      <section className="feature-hero insights-hero">
        <div>
          <p className="eyebrow">AI + delivery map</p>
          <h1>Predict demand and plan smarter pickups</h1>
          <p>Smart demo insights use real donation records without paid AI or map APIs.</p>
        </div>
        <button className="light-button" type="button" onClick={fetchInsights}>Refresh insights</button>
      </section>

      {error && <div className="alert alert-error feature-alert">{error}</div>}
      {loading && <div className="empty-state feature-alert">Loading AI insights...</div>}

      {insights && !loading && (
        <>
          <section className="feature-grid four-up">
            <article className="feature-card">
              <span>{insights.predictedDemand}</span>
              <h2>Predicted next demand</h2>
              <p>Estimated meals/orders likely to need matching soon.</p>
            </article>
            <article className="feature-card">
              <span>{insights.co2SavedKg} kg</span>
              <h2>CO2 saved</h2>
              <p>Calculated from delivered donation quantities.</p>
            </article>
            <article className="feature-card">
              <span>{insights.highDemandCategories.length}</span>
              <h2>Food patterns</h2>
              <p>Top categories based on donation history.</p>
            </article>
            <article className="feature-card">
              <span>{insights.deliveryZones.length}</span>
              <h2>Map zones</h2>
              <p>Grouped pickup areas ready for route planning.</p>
            </article>
          </section>

          <section className="insights-layout">
            <div className="board-panel">
              <div className="section-heading">
                <p className="eyebrow">Prediction engine</p>
                <h2>High-demand food</h2>
              </div>
              <div className="mini-list">
                {insights.highDemandCategories.map((item) => (
                  <article key={item.foodType}>
                    <strong>{item.foodType}</strong>
                    <span>Demand score {item.score}</span>
                  </article>
                ))}
              </div>
            </div>

            <div className="map-panel">
              <div className="map-canvas" aria-label="Delivery map">
                {insights.deliveryZones.map((zone, index) => (
                  <div
                    className={`map-pin pin-${index + 1}`}
                    key={zone.location}
                    title={zone.location}
                  >
                    <span>{index + 1}</span>
                  </div>
                ))}
              </div>
              <div className="mini-list">
                {insights.deliveryZones.map((zone, index) => (
                  <article key={zone.location}>
                    <strong>{index + 1}. {zone.location}</strong>
                    <span>{zone.available} available, {zone.reserved} reserved, {zone.delivered} delivered</span>
                  </article>
                ))}
              </div>
            </div>

            <div className="board-panel">
              <div className="section-heading">
                <p className="eyebrow">Pickup priority</p>
                <h2>Suggested queue</h2>
              </div>
              <div className="mini-list">
                {insights.priorityQueue.length === 0 ? (
                  <div className="empty-state">No active donations to prioritize.</div>
                ) : insights.priorityQueue.map((item) => (
                  <article key={item.id}>
                    <strong>{item.foodType}</strong>
                    <span>{item.quantity} - {item.location} - {item.priority} priority</span>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default InsightsPage;
