import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

// تفعيل اتجاه RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const API_URL =
  (Constants.expoConfig?.extra as any)?.apiUrl ?? 'http://localhost:4000/api';

interface Listing {
  id: string;
  title: string;
  city: string;
  price?: string | null;
  saleType: string;
  media?: { url: string }[];
  category?: { name: string; icon?: string };
}

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/listings`)
      .then((r) => r.json())
      .then((d) => setListings(d.items ?? []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerText}>🐪 مزاد</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0f7b6c" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.media?.[0]?.url ? (
                <Image source={{ uri: item.media[0].url }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Text style={{ fontSize: 40 }}>{item.category?.icon ?? '🐾'}</Text>
                </View>
              )}
              <View style={{ flex: 1, padding: 12 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>📍 {item.city}</Text>
                <Text style={styles.price}>
                  {item.saleType === 'AUCTION'
                    ? '🔨 مزاد'
                    : item.price
                    ? `${Number(item.price).toLocaleString('ar-SA')} ﷼`
                    : 'على السوم'}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
              لا توجد إعلانات
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf7f0' },
  header: { backgroundColor: '#0f7b6c', paddingTop: 50, paddingBottom: 16, alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  image: { width: 110, height: 110 },
  placeholder: { backgroundColor: '#f3ebd9', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'right' },
  meta: { color: '#777', marginTop: 4, textAlign: 'right' },
  price: { color: '#0a5c50', fontWeight: '800', fontSize: 16, marginTop: 6, textAlign: 'right' },
});
