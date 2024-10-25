import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Web3 from 'web3';
import styled from 'styled-components';
import { abi } from '../../abi';
import { pinata } from '../../config';

const contractAddress = '0x9Ee21d28D0dca2e5195b23b5372BE7F112A36256'; // Replace with your contract address

const ScannerLogin = () => {
  const { id } = useParams(); // Get the prescription ID from the URL
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFulfilled, setIsFulfilled] = useState(false);
  const [url, setUrl] = useState('');

  // Initialize Web3 and contract instance
  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3 = new Web3('http://127.0.0.1:8545'); // Connect to Ganache
        try {
          const accounts = await web3.eth.getAccounts();
          const contractInstance = new web3.eth.Contract(abi, contractAddress);

          setWeb3(web3);
          setContract(contractInstance);
          setAccount(accounts[8]); // Update to appropriate account if required
        } catch (error) {
          console.error('Error connecting to MetaMask:', error);
        }
      } else {
        console.error('No Ethereum wallet detected.');
      }
    };

    initWeb3();
  }, []);

  // Fetch prescription details
  const fetchPrescription = async () => {
    if (contract && id) {
      try {
        setLoading(true); // Set loading to true before fetching
        const prescriptionData = await contract.methods.getPrescription(id).call();
        console.log(prescriptionData);
        setPrescription({
          prescriptionId: prescriptionData[0].toString(),
          userId: prescriptionData[1],
          timestamp: new Date(parseInt(prescriptionData[2]) * 1000),
          description: prescriptionData[3],
          dept: prescriptionData[4].toString(),
          medicines: Array.isArray(prescriptionData[5]) ? prescriptionData[5] : [prescriptionData[5]], // Ensure it's an array
          documents: Array.isArray(prescriptionData[6]) ? prescriptionData[6] : [prescriptionData[6]],
          allergies: Array.isArray(prescriptionData[7]) ? prescriptionData[7] : [prescriptionData[7]],
          isFulfilled: prescriptionData[8],
        });
        setIsFulfilled(prescriptionData[8]);

        const signedUrl = await pinata.gateways.createSignedURL({
          cid: 'bafybeifocbigpbnlup47txhxvbe5fny6epj43oru6g4etg2z635rr3xewy',
          expires: 60000,
        });
        setUrl(signedUrl);
      } catch (error) {
        console.error('Error fetching prescription:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPrescription();
  }, [contract, id]);

  // Function to fulfill the prescription
  const fulfillPrescription = async () => {
    if (contract && account && id) {
      try {
        await contract.methods.fulfillPrescription(id).send({ from: account });
        alert('Prescription fulfilled successfully.');

        // Re-fetch prescription details to update the state
        await fetchPrescription();
      } catch (error) {
        console.error('Error fulfilling prescription:', error);
        alert('Error fulfilling prescription. Make sure you have the correct role and are connected to the network.');
      }
    }
  };

  if (loading) {
    return <LoadingMessage>Loading prescription details...</LoadingMessage>;
  }

  if (!prescription) {
    return <ErrorMessage>Prescription not found.</ErrorMessage>;
  }

  return (
    <Container>
      <Card>
        <Title>Prescription Details</Title>
        <Grid>
          <Detail>
            <Label>Prescription ID:</Label> <Value>{prescription.prescriptionId}</Value>
          </Detail>
          <Detail>
            <Label>User ID:</Label> <Value>{prescription.userId}</Value>
          </Detail>
          <Detail>
            <Label>Timestamp:</Label> <Value>{prescription.timestamp.toString()}</Value>
          </Detail>
          <Detail>
            <Label>Department:</Label> <Value>{prescription.dept}</Value>
          </Detail>
        </Grid>

        <Section>
          <Label>Description:</Label>
          <Text>{prescription.description}</Text>
        </Section>

        <Section>
          <Label>Medicines:</Label>
          <Text>{prescription.medicines.join(', ')}</Text>
        </Section>

        <Section>
          <Label>Allergies:</Label>
          <Text>{prescription.allergies.length > 0 ? prescription.allergies.join(', ') : 'None'}</Text>
        </Section>

        <Section>
          <Label>Documents:</Label>
          <DocumentList>
            {prescription.documents.map((doc, index) => (
              <DocumentItem key={index}>
                <DocumentLink href={url} target="_blank" rel="noopener noreferrer">
                  Document {index + 1}
                </DocumentLink>
              </DocumentItem>
            ))}
          </DocumentList>
        </Section>

        <Section>
          <Label>Status:</Label>
          <StatusText fulfilled={isFulfilled}>{isFulfilled ? 'Fulfilled' : 'Not Fulfilled'}</StatusText>
        </Section>

        {!isFulfilled && (
          <ButtonWrapper>
            <FulfillButton onClick={fulfillPrescription}>Update Prescription as Fulfilled</FulfillButton>
          </ButtonWrapper>
        )}
      </Card>
    </Container>
  );
};

export default ScannerLogin;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #ebf8ff, #ffffff);
  padding: 2rem;
`;

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 800px;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: #1a202c;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Detail = styled.div`
  background-color: #edf2f7;
  border-radius: 8px;
  padding: 1rem;
`;

const Label = styled.strong`
  display: block;
  color: #2d3748;
  font-size: 1.1rem;
`;

const Value = styled.span`
  color: #4a5568;
  font-size: 1rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const Text = styled.p`
  color: #2d3748;
  margin-top: 0.5rem;
  font-size: 1.1rem;
`;

const DocumentList = styled.ul`
  list-style: none;
  padding: 0;
`;

const DocumentItem = styled.li`
  margin: 0.5rem 0;
`;

const DocumentLink = styled.a`
  color: #3182ce;
  text-decoration: underline;
  &:hover {
    text-decoration: none;
    color: #2b6cb0;
  }
`;

const StatusText = styled.span`
  color: ${({ fulfilled }) => (fulfilled ? '#38a169' : '#e53e3e')};
  font-weight: bold;
  font-size: 1.1rem;
`;

const ButtonWrapper = styled.div`
  text-align: center;
  margin-top: 2rem;
`;

const FulfillButton = styled.button`
  background-color: #3182ce;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #2b6cb0;
    transform: scale(1.05);
  }
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #2d3748;
`;

const ErrorMessage = styled(LoadingMessage)`
  color: #e53e3e;
`;
