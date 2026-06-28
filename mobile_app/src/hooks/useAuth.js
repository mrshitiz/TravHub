import { useState, useRef, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { apiService } from '../services/apiService';
import { databaseService } from '../services/databaseService';

export const useAuth = (onLoginSuccess) => {
  const [screen, setScreen] = useState('welcome'); // welcome | feed | profile
  const [authMode, setAuthMode] = useState('login'); // login | signup
  const [isInitializing, setIsInitializing] = useState(true);

  // Credential fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [pinValues, setPinValues] = useState(['', '', '', '', '', '']);

  // Business profile fields
  const [agencyName, setAgencyName] = useState('');
  const [city, setCity] = useState('');
  const [agencyLogo, setAgencyLogo] = useState('💼');

  // Address and handler details
  const [streetAddress, setStreetAddress] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [handlingPerson, setHandlingPerson] = useState('');
  const [handlingPosition, setHandlingPosition] = useState('');

  // Dropdowns & segmented control fields
  const [userType, setUserType] = useState('agency'); // agency | hotel
  const [agencyType, setAgencyType] = useState('b2c'); // b2c | b2b | both
  const [hotelCategory, setHotelCategory] = useState('resort'); // resort | boutique | luxury | budget
  const [specializations, setSpecializations] = useState([]); // list of strings
  const [gstin, setGstin] = useState(''); // optional GSTIN code

  // Logged-in profile states
  const [currentUserType, setCurrentUserType] = useState('agency');
  const [currentAgencyType, setCurrentAgencyType] = useState('b2c');
  const [currentHotelCategory, setCurrentHotelCategory] = useState('resort');
  const [currentSpecializations, setCurrentSpecializations] = useState([]);
  const [currentGstin, setCurrentGstin] = useState('');
  const [currentUserStatus, setCurrentUserStatus] = useState('approved'); // approved | pending
  const [currentUserVerified, setCurrentUserVerified] = useState(false);
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState('none'); // none | applied | verified
  const [bio, setBio] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);

  const pinRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const savedPhone = databaseService.getItem('auth_phone');
        const savedPin = databaseService.getItem('auth_pin');
        if (savedPhone && savedPin) {
          setPhone(savedPhone);
          const userDoc = await apiService.loginUser(savedPhone, savedPin);
          
          setAgencyName(userDoc.agencyName || '');
          setCity(userDoc.city || '');
          setAgencyLogo(userDoc.agencyLogo || '💼');
          setBio(userDoc.bio || '');
          setCurrentUserType(userDoc.userType || 'agency');
          setCurrentAgencyType(userDoc.agencyType || 'b2c');
          setCurrentHotelCategory(userDoc.hotelCategory || 'resort');
          setCurrentSpecializations(userDoc.specializations || []);
          setCurrentGstin(userDoc.gstin || '');
          setStreetAddress(userDoc.streetAddress || '');
          setCountry(userDoc.country || 'India');
          setState(userDoc.state || '');
          setPincode(userDoc.pincode || '');
          setHandlingPerson(userDoc.handlingPerson || '');
          setHandlingPosition(userDoc.handlingPosition || '');
          setEmail(userDoc.email || '');
          setFollowers(userDoc.followers || []);
          setFollowing(userDoc.following || []);
          setSavedPosts(userDoc.savedPosts || []);

          const loadedStatus = userDoc.status || (userDoc.userType === 'agency' && userDoc.agencyType === 'b2c' ? 'approved' : 'pending');
          setCurrentUserStatus(loadedStatus);

          const isVerified = userDoc.isVerified || false;
          setCurrentUserVerified(isVerified);

          const loadedVerificationStatus = userDoc.verificationStatus || (isVerified ? 'verified' : 'none');
          setCurrentVerificationStatus(loadedVerificationStatus);

          setScreen('feed');
          if (onLoginSuccess) onLoginSuccess(userDoc);
        }
      } catch (e) {
        console.error('Failed to auto-login', e);
        databaseService.removeItem('auth_phone');
        databaseService.removeItem('auth_pin');
      } finally {
        setIsInitializing(false);
      }
    };
    checkLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = async () => {
    // Sanitize phone number (remove +91, spaces, dashes)
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    }

    if (cleanPhone.length !== 10) {
      if (Platform.OS === 'web') window.alert('Invalid Phone: Please enter exactly a 10-digit mobile number.');
      else Alert.alert('Invalid Phone', 'Please enter exactly a 10-digit mobile number.');
      return;
    }
    const pin = pinValues.join('');
    if (pin.length < 6) {
      if (Platform.OS === 'web') window.alert('Invalid PIN: Please enter a 6-digit PIN.');
      else Alert.alert('Invalid PIN', 'Please enter a 6-digit PIN.');
      return;
    }

    if (authMode === 'signup') {
      if (!agencyName || !city || !email.trim()) {
        if (Platform.OS === 'web') window.alert('Required Fields: Please fill in all details (Company Name, City, and Email).');
        else Alert.alert('Required Fields', 'Please fill in all details (Company Name, City, and Email).');
        return;
      }
      try {
        const exists = await apiService.checkUserExists(cleanPhone);
        if (exists) {
          if (Platform.OS === 'web') window.alert('Error: A business with this mobile number is already registered.');
          else Alert.alert('Error', 'A business with this mobile number is already registered.');
          return;
        }

        // Set default logo emoji depending on business type
        let defaultLogo = '💼';
        if (agencyName && agencyName.toLowerCase().includes('travhub')) {
          defaultLogo = 'travhub_logo';
        } else if (userType === 'hotel') {
          defaultLogo = '🏨';
        } else if (userType === 'agency') {
          if (agencyType === 'b2b') {
            defaultLogo = '🤝';
          } else if (agencyType === 'b2c') {
            defaultLogo = '🏖️';
          } else {
            defaultLogo = '🌐';
          }
        }

        const isB2CAgency = userType === 'agency' && agencyType === 'b2c';
        const initialStatus = isB2CAgency ? 'approved' : 'pending';

        const userData = {
          phone: cleanPhone,
          password: pin,
          email: email.trim(),
          agencyName,
          city,
          agencyLogo: defaultLogo,
          userType,
          agencyType: userType === 'agency' ? agencyType : null,
          hotelCategory: userType === 'hotel' ? hotelCategory : null,
          specializations: userType === 'agency' ? specializations : null,
          gstin: gstin.trim() || null,
          status: initialStatus,
          isVerified: false,
          verificationStatus: 'none',
          bio: '',
          streetAddress: '',
          country: 'India',
          state: '',
          pincode: '',
          handlingPerson: '',
          handlingPosition: ''
        };

        await apiService.registerUser(userData);

        setAgencyLogo(defaultLogo);
        setCurrentUserType(userType);
        setCurrentAgencyType(agencyType);
        setCurrentHotelCategory(hotelCategory);
        setCurrentSpecializations(specializations);
        setCurrentGstin(gstin);
        setCurrentUserStatus(initialStatus);
        setCurrentUserVerified(false);
        setCurrentVerificationStatus('none');
        setBio('');
        setStreetAddress('');
        setCountry('India');
        setState('');
        setPincode('');
        setHandlingPerson('');
        setHandlingPosition('');
        setFollowers([]);
        setFollowing([]);
        setSavedPosts([]);

        databaseService.setItem('auth_phone', cleanPhone);
        databaseService.setItem('auth_pin', pin);
        if (Platform.OS === 'web') window.alert('Success: Registered successfully!');
        else Alert.alert('Success', 'Registered successfully!');
        setPinValues(['', '', '', '', '', '']);
        setScreen('feed');
        if (onLoginSuccess) onLoginSuccess(userData);
      } catch (error) {
        if (Platform.OS === 'web') window.alert(`Registration Error: ${error.message}`);
        else Alert.alert('Registration Error', error.message);
      }
    } else {
      // Login mode
      try {
        const userDoc = await apiService.loginUser(cleanPhone, pin);
        
        setAgencyName(userDoc.agencyName);
        setCity(userDoc.city);
        setAgencyLogo(userDoc.agencyLogo || '💼');
        setBio(userDoc.bio || '');
        setCurrentUserType(userDoc.userType || 'agency');
        setCurrentAgencyType(userDoc.agencyType || 'b2c');
        setCurrentHotelCategory(userDoc.hotelCategory || 'resort');
        setCurrentSpecializations(userDoc.specializations || []);
        setCurrentGstin(userDoc.gstin || '');
        setStreetAddress(userDoc.streetAddress || '');
        setCountry(userDoc.country || 'India');
        setState(userDoc.state || '');
        setPincode(userDoc.pincode || '');
        setHandlingPerson(userDoc.handlingPerson || '');
        setHandlingPosition(userDoc.handlingPosition || '');
        setEmail(userDoc.email || '');
        setFollowers(userDoc.followers || []);
        setFollowing(userDoc.following || []);
        setSavedPosts(userDoc.savedPosts || []);

        const loadedStatus = userDoc.status || (userDoc.userType === 'agency' && userDoc.agencyType === 'b2c' ? 'approved' : 'pending');
        setCurrentUserStatus(loadedStatus);

        const isVerified = userDoc.isVerified || false;
        setCurrentUserVerified(isVerified);

        const loadedVerificationStatus = userDoc.verificationStatus || (isVerified ? 'verified' : 'none');
        setCurrentVerificationStatus(loadedVerificationStatus);

        databaseService.setItem('auth_phone', cleanPhone);
        databaseService.setItem('auth_pin', pin);
        setPinValues(['', '', '', '', '', '']);
        setScreen('feed');
        if (onLoginSuccess) onLoginSuccess(userDoc);
      } catch (error) {
        if (Platform.OS === 'web') window.alert(`Login Error: ${error.message}`);
        else Alert.alert('Login Error', error.message);
      }
    }
  };

  const logout = async () => {
    setPhone('');
    setPinValues(['', '', '', '', '', '']);
    setAgencyName('');
    setCity('');
    setSavedPosts([]);
    setScreen('welcome');
    databaseService.removeItem('auth_phone');
    databaseService.removeItem('auth_pin');
    databaseService.clearDatabase();
  };

  const toggleSpecialization = (spec) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter(s => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  return {
    screen,
    setScreen,
    authMode,
    setAuthMode,
    isInitializing,
    phone,
    setPhone,
    password,
    setPassword,
    email,
    setEmail,
    pinValues,
    setPinValues,
    pinRefs,
    agencyName,
    setAgencyName,
    city,
    setCity,
    agencyLogo,
    setAgencyLogo,
    streetAddress,
    setStreetAddress,
    country,
    setCountry,
    state,
    setState,
    pincode,
    setPincode,
    handlingPerson,
    setHandlingPerson,
    handlingPosition,
    setHandlingPosition,
    userType,
    setUserType,
    agencyType,
    setAgencyType,
    hotelCategory,
    setHotelCategory,
    specializations,
    setSpecializations,
    gstin,
    setGstin,
    
    // Logged in user info
    currentUserType,
    setCurrentUserType,
    currentAgencyType,
    setCurrentAgencyType,
    currentHotelCategory,
    setCurrentHotelCategory,
    currentSpecializations,
    setCurrentSpecializations,
    currentGstin,
    setCurrentGstin,
    currentUserStatus,
    setCurrentUserStatus,
    currentUserVerified,
    setCurrentUserVerified,
    currentVerificationStatus,
    setCurrentVerificationStatus,
    bio,
    setBio,
    followers,
    setFollowers,
    following,
    setFollowing,
    savedPosts,
    setSavedPosts,

    // Actions
    handleAuth,
    logout,
    toggleSpecialization
  };
};
