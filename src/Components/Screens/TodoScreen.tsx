import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useRouter } from 'expo-router';

interface Todo {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  deadline: Date;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  userEmail: string;
}

export const TodoScreen = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [newTodo, setNewTodo] = useState<Partial<Todo>>({
    title: '',
    description: '',
    createdAt: new Date(),
    deadline: new Date(),
    priority: 'Medium',
    userEmail: user?.email || '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'createdAt' | 'deadline'>('createdAt');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getStorageKey = (email: string) => `@todos_${email}`;

  useEffect(() => {
    if (user?.email) {
      loadTodos();
    }
  }, [user?.email]);

  const loadTodos = async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      const storageKey = getStorageKey(user.email);
      const storedTodos = await AsyncStorage.getItem(storageKey);
      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
          deadline: new Date(todo.deadline),
        }));
        setTodos(parsedTodos);
      } else {
        setTodos([]);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
      Alert.alert('Error', 'Failed to load todos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTodos = async (updatedTodos: Todo[]) => {
    if (!user?.email) return;

    try {
      const storageKey = getStorageKey(user.email);
      const todosToSave = updatedTodos.map(todo => ({
        ...todo,
        createdAt: todo.createdAt.toISOString(),
        deadline: todo.deadline.toISOString(),
      }));
      await AsyncStorage.setItem(storageKey, JSON.stringify(todosToSave));
    } catch (error) {
      console.error('Error saving todos:', error);
      Alert.alert('Error', 'Failed to save todos. Please try again.');
    }
  };

  const resetForm = () => {
    setNewTodo({
      title: '',
      description: '',
      createdAt: new Date(),
      deadline: new Date(),
      priority: 'Medium',
      userEmail: user?.email || '',
    });
    setIsEditing(false);
    setEditingTodoId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (todo: Todo) => {
    setNewTodo({
      title: todo.title,
      description: todo.description,
      createdAt: todo.createdAt,
      deadline: todo.deadline,
      priority: todo.priority,
      userEmail: user?.email || '',
    });
    setEditingTodoId(todo.id);
    setIsEditing(true);
    setModalVisible(true);
  };

  const addTodo = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'Please sign in to add todos.');
      return;
    }

    if (newTodo.title?.trim()) {
      try {
        const todo: Todo = {
          id: Date.now().toString(),
          title: newTodo.title.trim(),
          description: newTodo.description?.trim() || '',
          createdAt: newTodo.createdAt || new Date(),
          deadline: newTodo.deadline || new Date(),
          priority: newTodo.priority || 'Medium',
          completed: false,
          userEmail: user.email,
        };
        const updatedTodos = [...todos, todo];
        setTodos(updatedTodos);
        await saveTodos(updatedTodos);
        resetForm();
        setModalVisible(false);
      } catch (error) {
        console.error('Error adding todo:', error);
        Alert.alert('Error', 'Failed to add todo. Please try again.');
      }
    }
  };

  const updateTodo = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'Please sign in to update todos.');
      return;
    }

    if (newTodo.title?.trim() && editingTodoId) {
      try {
        const updatedTodos = todos.map((todo) =>
          todo.id === editingTodoId
            ? {
                ...todo,
                title: newTodo.title.trim(),
                description: newTodo.description?.trim() || '',
                createdAt: newTodo.createdAt || todo.createdAt,
                deadline: newTodo.deadline || todo.deadline,
                priority: newTodo.priority || todo.priority,
                userEmail: user.email,
              }
            : todo
        );
        setTodos(updatedTodos);
        await saveTodos(updatedTodos);
        resetForm();
        setModalVisible(false);
      } catch (error) {
        console.error('Error updating todo:', error);
        Alert.alert('Error', 'Failed to update todo. Please try again.');
      }
    }
  };

  const toggleTodo = async (id: string) => {
    if (!user?.email) {
      Alert.alert('Error', 'Please sign in to update todos.');
      return;
    }

    try {
      const updatedTodos = todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      setTodos(updatedTodos);
      await saveTodos(updatedTodos);
    } catch (error) {
      console.error('Error toggling todo:', error);
      Alert.alert('Error', 'Failed to update todo status. Please try again.');
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user?.email) {
      Alert.alert('Error', 'Please sign in to delete todos.');
      return;
    }

    try {
      const updatedTodos = todos.filter((todo) => todo.id !== id);
      setTodos(updatedTodos);
      await saveTodos(updatedTodos);
    } catch (error) {
      console.error('Error deleting todo:', error);
      Alert.alert('Error', 'Failed to delete todo. Please try again.');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      if (datePickerMode === 'deadline') {
        const currentDate = new Date();
        if (selectedDate < currentDate) {
          selectedDate = currentDate;
        }
      }
      setNewTodo({ ...newTodo, [datePickerMode]: selectedDate });
    }
  };

  const showDatePickerModal = (mode: 'createdAt' | 'deadline') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#FF5252';
      case 'Medium':
        return '#FFA726';
      case 'Low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={styles.todoTextContainer}
        onPress={() => toggleTodo(item.id)}
      >
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.completed ? '#4CAF50' : '#757575'}
        />
        <View style={styles.todoContent}>
          <Text
            style={[
              styles.todoTitle,
              item.completed && styles.completedTodoText,
            ]}
          >
            {item.title}
          </Text>
          <Text style={styles.todoDescription}>{item.description}</Text>
          <View style={styles.todoDetails}>
            <Text style={styles.todoDate}>
              Created: {item.createdAt.toLocaleDateString()}
            </Text>
            <Text style={styles.todoDate}>
              Deadline: {item.deadline.toLocaleDateString()}
            </Text>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(item.priority) },
              ]}
            >
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.todoActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
          <Ionicons name="pencil" size={24} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={24} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user?.email) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Please sign in to view your todos.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading todos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id}
        style={styles.list}
      />
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Task' : 'Add New Task'}
            </Text>
            <ScrollView style={styles.modalScrollView}>
              <TextInput
                style={styles.input}
                value={newTodo.title}
                onChangeText={(text) => setNewTodo({ ...newTodo, title: text })}
                placeholder="Task Title"
                autoFocus
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newTodo.description}
                onChangeText={(text) => setNewTodo({ ...newTodo, description: text })}
                placeholder="Task Description"
                multiline
                numberOfLines={4}
              />
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => showDatePickerModal('createdAt')}
                >
                  <Text style={styles.dateButtonText}>
                    Created: {newTodo.createdAt?.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => showDatePickerModal('deadline')}
                >
                  <Text style={styles.dateButtonText}>
                    Deadline: {newTodo.deadline?.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.priorityContainer}>
                <Text style={styles.priorityLabel}>Priority:</Text>
                <View style={styles.priorityButtons}>
                  {['Low', 'Medium', 'High'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        newTodo.priority === priority && {
                          backgroundColor: getPriorityColor(priority),
                        },
                      ]}
                      onPress={() => setNewTodo({ ...newTodo, priority: priority as Todo['priority'] })}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          newTodo.priority === priority && styles.selectedPriorityText,
                        ]}
                      >
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={isEditing ? updateTodo : addTodo}
              >
                <Text style={styles.buttonText}>
                  {isEditing ? 'Update Task' : 'Add Task'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'createdAt' ? newTodo.createdAt! : newTodo.deadline!}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={datePickerMode === 'deadline' ? new Date() : undefined}
          timeZoneOffsetInMinutes={0}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  todoTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  todoContent: {
    flex: 1,
    marginLeft: 12,
  },
  todoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 4,
  },
  todoDescription: {
    fontSize: 14,
    color: '#546E7A',
    marginBottom: 8,
    lineHeight: 20,
  },
  todoDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  todoDate: {
    fontSize: 12,
    color: '#78909C',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedTodoText: {
    textDecorationLine: 'line-through',
    color: '#90A4AE',
  },
  todoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1A237E',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    color: '#1A237E',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
  },
  priorityContainer: {
    marginBottom: 20,
  },
  priorityLabel: {
    fontSize: 16,
    marginBottom: 12,
    color: '#1A237E',
    fontWeight: '600',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  priorityButtonText: {
    color: '#546E7A',
    fontWeight: '500',
  },
  selectedPriorityText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#ECEFF1',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateButtonText: {
    color: '#1A237E',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
}); 