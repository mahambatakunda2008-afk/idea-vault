import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from "react-native";
import * as SQLite from "expo-sqlite";

type Idea = { id: number; title: string; note: string | null; updated_at: string };

const dbPromise = SQLite.openDatabaseAsync("idea-vault.db");

export default function App() {
  const [ready, setReady] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const db = await dbPromise;
    const rows = await db.getAllAsync<Idea>(
      "SELECT id, title, note, updated_at FROM local_ideas ORDER BY updated_at DESC"
    );
    setIdeas(rows);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const db = await dbPromise;
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS local_ideas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          note TEXT,
          updated_at TEXT NOT NULL,
          sync_state TEXT NOT NULL DEFAULT 'local'
        );
      `);
      const rows = await db.getAllAsync<Idea>(
        "SELECT id, title, note, updated_at FROM local_ideas ORDER BY updated_at DESC"
      );
      if (active) {
        setIdeas(rows);
        setReady(true);
      }
    })().catch(() => setReady(true));
    return () => { active = false; };
  }, []);

  const save = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || saving) return;
    setSaving(true);
    try {
      const db = await dbPromise;
      await db.runAsync(
        "INSERT INTO local_ideas (title, note, updated_at, sync_state) VALUES (?, ?, ?, 'local')",
        cleanTitle, note.trim() || null, new Date().toISOString()
      );
      setTitle("");
      setNote("");
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const countLabel = useMemo(() => ideas.length === 1 ? "1 idea captured" : `${ideas.length} ideas captured`, [ideas.length]);

  if (!ready) {
    return <View style={styles.loading}><ActivityIndicator color="#67e8f9" /><Text style={styles.muted}>Opening your private vault…</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.brandRow}><View style={styles.mark}><Text style={styles.markText}>V</Text></View><Text style={styles.brand}>IDEA VAULT</Text></View>
            <Text style={styles.eyebrow}>YOUR THINKING SPACE</Text>
            <Text style={styles.heading}>Catch the thought.{ "\n" }Shape what comes next.</Text>
            <Text style={styles.intro}>A private place for ideas to become something real. Start anywhere. Develop them when you're ready.</Text>
            <View style={styles.offline}><View style={styles.dot} /><Text style={styles.offlineText}>On-device capture · works offline</Text></View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>QUICK CAPTURE</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Give your idea a name…" placeholderTextColor="#64748b" style={styles.input} maxLength={200} returnKeyType="next" />
            <TextInput value={note} onChangeText={setNote} placeholder="Add a little context (optional)" placeholderTextColor="#64748b" style={[styles.input, styles.note]} multiline maxLength={2000} textAlignVertical="top" />
            <Pressable onPress={save} disabled={!title.trim() || saving} style={({ pressed }) => [styles.button, (!title.trim() || saving) && styles.disabled, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>{saving ? "Saving…" : "Save to this device  +"}</Text>
            </Pressable>
            <Text style={styles.privacy}>Saved locally first. Account sync will connect this vault across your devices.</Text>
          </View>

          <View style={styles.listHeader}>
            <View><Text style={styles.sectionTitle}>Your ideas</Text><Text style={styles.muted}>{countLabel}</Text></View>
            <Text style={styles.localTag}>LOCAL</Text>
          </View>
          {ideas.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyGlyph}>✳</Text><Text style={styles.emptyTitle}>An empty page is full of possibility.</Text><Text style={styles.muted}>Your first idea will appear here, even without internet.</Text></View>
          ) : ideas.map((idea) => (
            <View key={idea.id} style={styles.idea}>
              <Text style={styles.ideaTitle}>{idea.title}</Text>
              {!!idea.note && <Text style={styles.ideaNote}>{idea.note}</Text>}
              <Text style={styles.ideaDate}>{new Date(idea.updated_at).toLocaleString()}</Text>
            </View>
          ))}
          <Text style={styles.footer}>IDEA VAULT  ·  A SHADECODE PRODUCT</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex:{flex:1}, safe:{flex:1,backgroundColor:"#07131b"}, loading:{flex:1,backgroundColor:"#07131b",alignItems:"center",justifyContent:"center",gap:12}, container:{padding:22,paddingBottom:48,gap:22},
  header:{paddingTop:18,gap:14}, brandRow:{flexDirection:"row",alignItems:"center",gap:10}, mark:{width:34,height:34,borderRadius:11,borderWidth:1,borderColor:"#155e75",alignItems:"center",justifyContent:"center",backgroundColor:"#082f40"}, markText:{color:"#67e8f9",fontSize:19,fontWeight:"800"}, brand:{color:"#cbd5e1",fontSize:11,fontWeight:"800",letterSpacing:2.4},
  eyebrow:{color:"#67e8f9",fontSize:10,fontWeight:"800",letterSpacing:2.2,marginTop:22}, heading:{fontSize:36,lineHeight:43,fontWeight:"700",letterSpacing:-1.2,color:"#f8fafc"}, intro:{fontSize:15,lineHeight:23,color:"#94a3b8",maxWidth:340},
  offline:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:8,borderWidth:1,borderColor:"#164e63",backgroundColor:"#082f40",borderRadius:30,paddingHorizontal:12,paddingVertical:8,marginTop:2}, dot:{width:7,height:7,borderRadius:4,backgroundColor:"#67e8f9"}, offlineText:{fontSize:11,color:"#a5f3fc",fontWeight:"600"},
  card:{backgroundColor:"#0c1d28",borderWidth:1,borderColor:"#1e3542",borderRadius:22,padding:18,gap:12}, sectionLabel:{fontSize:10,fontWeight:"800",letterSpacing:1.8,color:"#67e8f9",marginBottom:2}, input:{backgroundColor:"#07131b",borderWidth:1,borderColor:"#29404d",borderRadius:12,paddingHorizontal:14,paddingVertical:14,color:"#f8fafc",fontSize:15}, note:{minHeight:90}, button:{backgroundColor:"#67e8f9",borderRadius:12,padding:15,alignItems:"center",marginTop:2}, disabled:{opacity:0.4}, pressed:{opacity:0.8}, buttonText:{color:"#06202b",fontWeight:"800",fontSize:14}, privacy:{fontSize:11,lineHeight:17,color:"#64748b"},
  listHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:4}, sectionTitle:{fontSize:21,fontWeight:"700",color:"#f1f5f9"}, muted:{fontSize:12,color:"#64748b",marginTop:4}, localTag:{fontSize:9,fontWeight:"800",letterSpacing:1.4,color:"#67e8f9",borderColor:"#164e63",borderWidth:1,borderRadius:20,paddingHorizontal:9,paddingVertical:5},
  empty:{alignItems:"center",padding:26,borderWidth:1,borderStyle:"dashed",borderColor:"#29404d",borderRadius:18,gap:8}, emptyGlyph:{fontSize:24,color:"#67e8f9"}, emptyTitle:{fontSize:15,fontWeight:"700",color:"#cbd5e1",textAlign:"center"},
  idea:{padding:16,borderWidth:1,borderColor:"#1e3542",borderRadius:16,backgroundColor:"#0c1d28",gap:7}, ideaTitle:{fontSize:16,fontWeight:"700",color:"#f1f5f9"}, ideaNote:{fontSize:13,lineHeight:20,color:"#94a3b8"}, ideaDate:{fontSize:10,color:"#64748b",marginTop:3}, footer:{textAlign:"center",fontSize:9,color:"#475569",letterSpacing:1.5,marginTop:10}
});
