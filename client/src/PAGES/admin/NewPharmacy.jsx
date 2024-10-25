import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../API/api';
import styled from 'styled-components';
import Web3 from 'web3';
import { pinata } from '../../config';
import { abi } from '../../abi';
import AdminNav from './AdminNav';

const NewPharmacyContainer = styled.div`
  background-color: #f0f8ff;
  color: #003366;
  margin: auto;
  h2{
    display: flex;
    justify-content: center;
  }
`;

const PharmacyList = styled.ul`
 display: flex;
 flex-wrap: wrap;
 flex-direction: row;
 list-style-type: none;
 padding: 10px;
 width: 100%;
`;

const PharmacyItem = styled.li`
  padding: 20px;
  margin: 3rem;
  width: 400px;
  border: 1px solid #003366;
  border-radius: 5px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const VerifyButton = styled.button`
  background-color: #003366;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;

  &:hover {
    background-color: #002244;
  }
`;

const DocumentLink = styled.a`
  color: #003366;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const NewPharmacy = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const navigate = useNavigate();

  // Connect to Ganache (local blockchain)
  const web3 = new Web3('http://127.0.0.1:8545'); // Ganache local blockchain
  const contractAddress = '0x9Ee21d28D0dca2e5195b23b5372BE7F112A36256'; // Replace with your contract address
  const contract = new web3.eth.Contract(abi, contractAddress);

  // Fetch pharmacies from the API
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const response = await api.get('/admin/get-pharm-req');
        setPharmacies(response.data.pharmacies);

        // Pre-fetch signed URLs for each pharmacy's verificationHash
        response.data.pharmacies.forEach(async (pharmacy) => {
          if (pharmacy.verification) {
            const url = await getSignedUrl(pharmacy.verification);
            setSignedUrls((prev) => ({
              ...prev,
              [pharmacy._id]: url,
            }));
          }
        });
      } catch (error) {
        console.error('Error fetching pharmacies:', error);
      }
    };

    fetchPharmacies();
  }, []);

  // Function to verify a pharmacy
  const handleVerify = async (pharmacy) => {
    try {
      // First upload the pharmacy data to the blockchain
      await uploadToBlockchain(pharmacy);

      // Upon successful blockchain upload, update the backend
      await api.patch(`/admin/verify-pharm/${pharmacy._id}`);

      // Redirect to the dashboard
      navigate('/admin/dashboard');
    } catch (error) {
      alert(error.message);
      console.error('Error during verification:', error);
    }
  };

  async function uploadToBlockchain(hospital) {
    try {
      const accounts = await web3.eth.getAccounts(); // Get accounts from Ganache
        const tx = await contract.methods.registerFields(
          hospital.wallet,
          hospital._id,
          hospital.name,
          hospital.verification,
          0 // Role is Hospital (enum starts from 0)
        ).send({ from: accounts[0], gas: 1000000 }); // Adjust gas limit if necessary
        console.log('Transaction successful:', tx.transactionHash);
    } catch (error) {
        console.error('Error uploading hospital data to blockchain:', error);
        alert(`Error: ${error.message}`);
    }
}

  // Function to get signed URL for verification document
  const getSignedUrl = async (cid) => {
    try {
      const signedUrl = await pinata.gateways.createSignedURL({
        cid: cid,
        expires: 60, // URL expiration time in seconds
      });
      return signedUrl;
    } catch (err) {
      console.error('Error fetching signed URL:', err);
      return '';
    }
  };

  return (
    <NewPharmacyContainer>
      <AdminNav/>
      <h2>Pharmacy List</h2>
      <PharmacyList>
        {pharmacies.map((pharmacy) => (
          <PharmacyItem key={pharmacy._id}>
            <strong>Owner:</strong> {pharmacy.owner}
            <strong>Email:</strong> {pharmacy.email}
            <strong>Address:</strong> {pharmacy.address}
            <strong>Wallet:</strong> {pharmacy.wallet}
            <strong>Name:</strong> {pharmacy.name}
            <strong>Phone:</strong> {pharmacy.phone}
            <strong>Verification Status:</strong> {pharmacy.isVerified ? 'Verified' : 'Not Verified'}
            <VerifyButton onClick={() => handleVerify(pharmacy)}>Verify</VerifyButton>
            {signedUrls[pharmacy._id] && (
              <DocumentLink
                href={signedUrls[pharmacy._id]}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Verification Document
              </DocumentLink>
            )}
          </PharmacyItem>
        ))}
      </PharmacyList>
    </NewPharmacyContainer>
  );
};

export default NewPharmacy;
