import React, { useState } from 'react';
import styled from 'styled-components';
import Web3 from 'web3';
import { useNavigate } from 'react-router-dom';
import { abi } from '../../abi';  // Import the ABI from the abi.js file

// Ganache local blockchain address
const ganacheURL = 'http://127.0.0.1:8545'; // Ganache usually runs on this port
const contractAddress = '0x9Ee21d28D0dca2e5195b23b5372BE7F112A36256'; // Use your deployed contract address on Ganache

const AdminLogin = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Function to connect to Ganache
    const handleConnectMetamask = async () => {
        setLoading(true);

        try {
            // Create a Web3 instance and connect to Ganache's local blockchain
            const web3 = new Web3(new Web3.providers.HttpProvider(ganacheURL));

            // Get the accounts from Ganache
            const accounts = await web3.eth.getAccounts();
            setUser(accounts[0]);

            const contractInstance = new web3.eth.Contract(abi, contractAddress);
            const adminAddress = await contractInstance.methods.admin().call();

            // Check if the connected account matches the admin address
            if (accounts[0].toLowerCase() === adminAddress.toLowerCase()) {
                navigate('/admin/dashboard');
            } else {
                alert('You are not the admin');
            }

            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error connecting to Ganache:', error);
            alert('Connection to Ganache failed. Make sure Ganache is running.');
        }
    };

    return (
        <Container>
            <Heading>Connect to Ganache to Continue</Heading>
            <Button onClick={handleConnectMetamask} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Ganache'}
            </Button>
        </Container>
    );
};

export default AdminLogin;

// Styled Components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #f0f8ff;
`;

const Heading = styled.h1`
    color: #1e90ff;
    margin-bottom: 20px;
`;

const Button = styled.button`
    background-color: #1e90ff;
    color: #fff;
    padding: 10px 20px;
    font-size: 18px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: #4682b4;
    }

    &:disabled {
        background-color: #87cefa;
        cursor: not-allowed;
    }
`;
