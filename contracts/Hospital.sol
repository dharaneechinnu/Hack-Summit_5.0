// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract Hospital  {
    enum Dept { Cardiology, Psychiatry, General }
    enum Role { Pharmacy, Receptionist, Hospital } 

    struct Doctor {
        string id;   
        string hospital;             // MongoDB _id reference
        address doctorAddress;    
        string verificationHash;
        Dept dept;                // Department of the doctor
    }

    struct User {                 // Combined struct for Pharmacy and Receptionist
        string id;   
        string name;             // MongoDB _id reference
        address userAddress;
        string verificationHash;
        Role role;                // Role (Pharmacy or Receptionist)
    }

    struct Prescription {
        uint256 prescriptionId;
        string hospital;  
        string userId;            // Acts as a unique id from MongoDB
        uint256 timestamp;        // Prescription creation timestamp
        string description;       // Prescription description
        Dept dept;
        string[] medicines;       // List of medicines
        string[] documents;       // Related documents
        string[] allergies;       // Allergies information
        bool isFulfilled;         // Status if the prescription has been fulfilled
    }

    address public admin;                        // Hospital admin
    uint256 public prescriptionCount = 0;        // Count of prescriptions
    mapping(address => Doctor) public doctors;   // Mapping for doctors
    mapping(address => User) public users;       // Mapping for pharmacies, receptionists and Hospitals (combined into 'users')
    mapping(uint256 => Prescription) public prescriptions; // Mapping for prescriptions

    event PrescriptionCreated(uint256 prescriptionId, string userId, string description, Dept dept);
    event PrescriptionFulfilled(uint256 prescriptionId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyVerifiedDoctor() {
        require(doctors[msg.sender].doctorAddress != address(0), "User is not a verified doctor");
        _;
    }

    modifier onlyVerifiedUser(Role _role) {
        require(users[msg.sender].userAddress != address(0), "User is not registered");
        require(users[msg.sender].role == _role, "User role mismatch");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Register Hospital and Pharmacy
    function registerFields(
        address _userAddress, 
        string memory _id, 
        string memory name,
        string memory _verificationHash, 
        Role _role
    ) public onlyAdmin {
        require(users[_userAddress].userAddress == address(0), "User already exists");

        users[_userAddress] = User({
            id: _id,
            name: name,
            userAddress: _userAddress,
            verificationHash: _verificationHash,
            role: _role
        });
    }

    // Register a doctor
    function registerDoctor(
        address _doctorAddress, 
        string memory _id, 
        string memory _hospital,
        string memory _verificationHash, 
        Dept _dept
    ) public onlyVerifiedUser(Role.Hospital) {
        require(doctors[_doctorAddress].doctorAddress == address(0), "Doctor already exists");

        doctors[_doctorAddress] = Doctor({
            id: _id,
            hospital: _hospital,
            doctorAddress: _doctorAddress,
            verificationHash: _verificationHash,
            dept: _dept
        });
    }

    //register Receptionist
    function registerReceptionist(
        address _userAddress, 
        string memory _id, 
        string memory name,
        string memory _verificationHash, 
        Role _role
    ) public onlyVerifiedUser(Role.Hospital)  {
        require(users[_userAddress].userAddress == address(0), "User already exists");

        users[_userAddress] = User({
            id: _id,
            name: name,
            userAddress: _userAddress,
            verificationHash: _verificationHash,
            role: _role
        });
    }

    // Get doctor details
    function getDoctorDetails(address _doctorAddress) public view returns (Doctor memory) {
        require(doctors[_doctorAddress].doctorAddress != address(0), "Doctor does not exist");
        return doctors[_doctorAddress];
    }

    // Get user details
    function getUserDetails(address _userAddress) public view returns (User memory) {
        require(users[_userAddress].userAddress != address(0), "User does not exist");
        return users[_userAddress];
    }

    // Receptionist creates or updates a prescription
    function createPrescription(
        string memory _userId, 
        string memory _description, 
        Dept _dept,
        string memory _hospitalName,
        string[] memory _medicines, 
        string[] memory _documents, 
        string[] memory _allergies
    ) public onlyVerifiedUser(Role.Receptionist) {
        prescriptionCount++;
        prescriptions[prescriptionCount] = Prescription({
            prescriptionId: prescriptionCount,
            hospital: _hospitalName,
            userId: _userId,
            timestamp: block.timestamp,
            description: _description,
            dept: _dept,
            medicines: _medicines,
            documents: _documents,
            allergies: _allergies,
            isFulfilled: false
        });
        emit PrescriptionCreated(prescriptionCount, _userId, _description, _dept);
    }

    // Pharmacy fulfills a prescription
    function fulfillPrescription(uint256 _prescriptionId) public onlyVerifiedUser(Role.Pharmacy) {
        Prescription storage prescription = prescriptions[_prescriptionId];
        require(prescription.prescriptionId != 0, "Prescription does not exist");
        require(!prescription.isFulfilled, "Prescription already fulfilled");

        prescription.isFulfilled = true;
        emit PrescriptionFulfilled(_prescriptionId);
    }

    // Get prescription details by ID
    function getPrescription(uint256 _prescriptionId) public view returns (Prescription memory) {
        require(prescriptions[_prescriptionId].prescriptionId != 0, "Prescription does not exist");
        return prescriptions[_prescriptionId];
    }
}