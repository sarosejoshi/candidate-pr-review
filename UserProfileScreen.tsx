import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

export default function UserProfileScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, [users]);

  const loadUsers = async () => {
    const savedToken = await AsyncStorage.getItem('authToken');
    setToken(savedToken || '');

    const response = await fetch(
      `https://api.example.com/users?token=${savedToken}`
    );

    const data = await response.json();
    setUsers(data.users);
  };

  const deleteUser = async (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            await fetch(
              `https://api.example.com/users/${userId}?token=${token}`,
              { method: 'DELETE' }
            );

            setUsers(users.filter(user => user.id !== userId));
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => Alert.alert('Email', item.email)}
    >
      <Image
        source={{ uri: item.avatar }}
        style={{ width: 80, height: 80 }}
      />

      <Text>{item.name}</Text>
      <Text>{item.email}</Text>

      <TouchableOpacity onPress={() => deleteUser(item.id)}>
        <Text>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={user => user.id}
        removeClippedSubviews={false}
      />
    </View>
  );
}
