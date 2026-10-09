import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const STORAGE_KEY = 'clearlist-todos';
const FILTERS = [
  ['all', 'All'],
  ['active', 'Active'],
  ['done', 'Done'],
];

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function loadTodos() {
      try {
        const savedTodos = await AsyncStorage.getItem(STORAGE_KEY);
        const parsedTodos = savedTodos ? JSON.parse(savedTodos) : [];
        if (Array.isArray(parsedTodos)) {
          setTodos(parsedTodos);
        }
      } catch {
        // Start with an empty list if saved data is unavailable.
      } finally {
        setHydrated(true);
      }
    }

    loadTodos();
  }, []);

  useEffect(() => {
    if (hydrated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos)).catch(() => {});
    }
  }, [hydrated, todos]);

  const visibleTodos = useMemo(
    () =>
      todos.filter((todo) => {
        if (filter === 'active') return !todo.done;
        if (filter === 'done') return todo.done;
        return true;
      }),
    [filter, todos],
  );

  const remaining = todos.filter((todo) => !todo.done).length;
  const completedCount = todos.length - remaining;

  function addTodo() {
    const value = text.trim();
    if (!value) return;

    setTodos((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: value,
        done: false,
      },
      ...current,
    ]);
    setText('');
  }

  function toggleTodo(id) {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    );
  }

  function deleteTodo(id) {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((current) => current.filter((todo) => !todo.done));
  }

  function renderTodo({ item }) {
    return (
      <View style={[styles.item, item.done && styles.itemDone]}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.done }}
          accessibilityLabel={`${item.done ? 'Mark incomplete' : 'Complete'} ${item.text}`}
          onPress={() => toggleTodo(item.id)}
          style={styles.todoContent}
        >
          <View style={[styles.checkbox, item.done && styles.checkboxChecked]}>
            {item.done && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.todoText, item.done && styles.todoTextDone]}>
            {item.text}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.text}`}
          hitSlop={8}
          onPress={() => deleteTodo(item.id)}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
        >
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      </View>
    );
  }

  const countLabel =
    remaining === 0
      ? todos.length === 0
        ? 'No tasks yet'
        : 'All clear'
      : `${remaining} left`;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.app}
    >
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.atmosphere}>
        <View style={[styles.glow, styles.glowTopLeft]} />
        <View style={[styles.glow, styles.glowTopRight]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>

      <View style={styles.shell}>
        <View style={styles.hero}>
          <Text style={styles.brand}>Clearlist</Text>
          <Text style={styles.title}>What needs doing?</Text>
          <Text style={styles.lede}>Add a task, check it off, keep moving.</Text>
        </View>

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="New task"
            autoCapitalize="sentences"
            blurOnSubmit={false}
            onChangeText={setText}
            onSubmitEditing={addTodo}
            placeholder="Write a task…"
            placeholderTextColor="#8aa39a"
            returnKeyType="done"
            style={styles.input}
            value={text}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!text.trim()}
            onPress={addTodo}
            style={({ pressed }) => [
              styles.addButton,
              !text.trim() && styles.buttonDisabled,
              pressed && text.trim() && styles.buttonPressed,
            ]}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          <Text style={styles.count}>{countLabel}</Text>
          <View accessibilityRole="tablist" style={styles.filters}>
            {FILTERS.map(([value, label]) => {
              const active = filter === value;
              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  key={value}
                  onPress={() => setFilter(value)}
                  style={[styles.filterButton, active && styles.filterActive]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <FlatList
          contentContainerStyle={styles.list}
          data={visibleTodos}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          renderItem={renderTodo}
          showsVerticalScrollIndicator={false}
          style={styles.todoList}
          ListEmptyComponent={
            todos.length > 0 ? (
              <Text style={styles.empty}>Nothing in this view.</Text>
            ) : null
          }
        />

        {completedCount > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={clearCompleted}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.clearButtonPressed,
            ]}
          >
            <Text style={styles.clearText}>
              Clear {completedCount} completed
            </Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#eef8f3',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f3faf7',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.5,
  },
  glowTopLeft: {
    width: 330,
    height: 330,
    left: -150,
    top: -150,
    backgroundColor: '#9fe8c8',
  },
  glowTopRight: {
    width: 300,
    height: 300,
    right: -150,
    top: 30,
    backgroundColor: '#b8e0f0',
  },
  glowBottom: {
    width: 420,
    height: 260,
    bottom: -160,
    left: -20,
    backgroundColor: '#dcefc7',
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  hero: {
    marginBottom: 26,
  },
  brand: {
    color: '#1a2e2a',
    fontSize: 45,
    fontWeight: '800',
    letterSpacing: -1.8,
    lineHeight: 48,
    marginBottom: 8,
  },
  title: {
    color: '#5a726b',
    fontSize: 23,
    fontWeight: '600',
    letterSpacing: -0.4,
    marginBottom: 7,
  },
  lede: {
    color: '#5a726b',
    fontSize: 16,
    lineHeight: 23,
  },
  composer: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 46, 42, 0.12)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    color: '#1a2e2a',
    fontSize: 16,
  },
  addButton: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#0d9f6e',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    backgroundColor: '#0a7a54',
    transform: [{ scale: 0.97 }],
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  count: {
    color: '#5a726b',
    fontSize: 14,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(26, 46, 42, 0.12)',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  filterActive: {
    backgroundColor: '#1a2e2a',
  },
  filterText: {
    color: '#5a726b',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  todoList: {
    flex: 1,
  },
  list: {
    gap: 9,
    paddingBottom: 16,
  },
  item: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(26, 46, 42, 0.12)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
  },
  itemDone: {
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
  },
  todoContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 21,
    height: 21,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8fb5a6',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderColor: '#0d9f6e',
    backgroundColor: '#0d9f6e',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  todoText: {
    flex: 1,
    color: '#1a2e2a',
    fontSize: 16,
    lineHeight: 23,
  },
  todoTextDone: {
    color: '#5a726b',
    opacity: 0.7,
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  deleteButtonPressed: {
    backgroundColor: '#fde8e5',
  },
  deleteText: {
    color: '#5a726b',
    fontSize: 25,
    lineHeight: 27,
  },
  empty: {
    marginTop: 24,
    color: '#5a726b',
    textAlign: 'center',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 13,
    marginBottom: 12,
    borderRadius: 14,
  },
  clearButtonPressed: {
    backgroundColor: '#fde8e5',
  },
  clearText: {
    color: '#5a726b',
    fontWeight: '600',
  },
});
