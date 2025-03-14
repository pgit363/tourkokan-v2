import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const SearchPanel = () => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const handleSearch = () => {
        Alert.alert('Search', `Finding buses from "${from}" to "${to}"`);
    };

    const handleSwap = () => {
        const temp = from;
        setFrom(to);
        setTo(temp);
    };

    return (
        <View style={styles.card}>
            <Text style={styles.heading}>Find Your Routes</Text>

            <TextInput
                placeholder="Source"
                value={from}
                onChangeText={setFrom}
                style={styles.input}
            />

            <TextInput
                placeholder="Destination"
                value={to}
                onChangeText={setTo}
                style={styles.input}
            />

            <View style={styles.buttonRow}>
                <TouchableOpacity onPress={handleSwap} style={styles.swapBtn}>
                    <Text style={styles.swapBtnText}>↑↓</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
                    <Text style={styles.searchBtnText}>Search Buses</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        margin: 16,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 4,
    },
    heading: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        marginVertical: 8,
        borderRadius: 8,
        fontSize: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    swapBtn: {
        backgroundColor: '#e0e0e0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 8,
    },
    swapBtnText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
    },
    searchBtn: {
        flex: 1,
        backgroundColor: '#d32f2f',
        paddingVertical: 12,
        borderRadius: 8,
    },
    searchBtnText: {
        textAlign: 'center',
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SearchPanel;
