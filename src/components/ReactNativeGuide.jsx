import React from 'react';
import { Smartphone, Code, ArrowRight, CheckCircle } from 'lucide-react';

export default function ReactNativeGuide() {
  return (
    <div className="rn-guide-box">
      <div className="rn-guide-header">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', color: '#FFFDF9', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Smartphone size={28} color="var(--pink-accent)" />
            React.js to React Native Conversion Architecture
          </h2>
          <p style={{ color: '#E2D9EE', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            This application is structured specifically to make converting to iOS & Android with React Native effortless.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'var(--pink-accent)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>1. Shared Hook & State</div>
          <p style={{ fontSize: '0.85rem', color: '#D3C4E3' }}>
            <code>useListingStore.js</code> is 100% compatible with React Native. Replace <code>localStorage</code> with <code>AsyncStorage</code>.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'var(--pink-accent)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>2. Theme Palette Tokens</div>
          <p style={{ fontSize: '0.85rem', color: '#D3C4E3' }}>
            Baby Pink, Cream, Off-white, and Violet variables in CSS translate directly into JavaScript <code>theme.js</code> objects.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'var(--pink-accent)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>3. Component Direct Mapping</div>
          <p style={{ fontSize: '0.85rem', color: '#D3C4E3' }}>
            JSX tags map 1:1 to React Native primitives (View, Text, TouchableOpacity, FlatList, Modal).
          </p>
        </div>
      </div>

      <div className="rn-code-comparison">
        <div>
          <div className="code-title">React.js Web (Current Code)</div>
          <pre className="code-block">
{`// ListingCard.jsx (Web React)
export default function ListingCard({ listing, onAction }) {
  return (
    <div className="listing-card">
      <img src={listing.image} className="listing-img" />
      <div className="listing-content">
        <h3>{listing.title}</h3>
        <p>{listing.location}</p>
        <button className="btn-primary" onClick={onAction}>
          Request Woods & Funds
        </button>
      </div>
    </div>
  );
}`}
          </pre>
        </div>

        <div>
          <div className="code-title">React Native iOS / Android Equivalent</div>
          <pre className="code-block">
{`// ListingCard.native.jsx (React Native)
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function ListingCard({ listing, onAction }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: listing.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.location}>{listing.location}</Text>
        <TouchableOpacity style={styles.btn} onPress={onAction}>
          <Text style={styles.btnText}>Request Woods & Funds</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
