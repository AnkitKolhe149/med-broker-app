import { useState, useEffect } from 'react';

export function useCheckoutForm(userCustomer, userEmail, showError) {
  const [deliveryType, setDeliveryType] = useState('home_delivery');
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  const [orderNotes, setOrderNotes] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate address from user profile
  useEffect(() => {
    if (userCustomer) {
      setDeliveryAddress(prev => ({
        ...prev,
        fullName: userCustomer.fullName || '',
        phone: userCustomer.phoneNumber || '',
        email: userEmail || '',
        address: userCustomer.address || '',
        city: userCustomer.city || '',
        state: userCustomer.state || '',
        zipCode: userCustomer.zipCode || '',
        country: 'India'
      }));
    }
  }, [userCustomer, userEmail]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!deliveryAddress.fullName.trim()) {
      showError('Please enter your full name');
      return false;
    }
    if (!deliveryAddress.phone.trim() || deliveryAddress.phone.length < 10) {
      showError('Please enter a valid phone number');
      return false;
    }
    if (!deliveryAddress.address.trim()) {
      showError('Please enter your address');
      return false;
    }
    if (!deliveryAddress.city.trim()) {
      showError('Please enter your city');
      return false;
    }
    if (!deliveryAddress.zipCode.trim()) {
      showError('Please enter your ZIP code');
      return false;
    }
    if (!agreeTerms) {
      showError('Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  return {
    deliveryType,
    setDeliveryType,
    deliveryAddress,
    handleAddressChange,
    orderNotes,
    setOrderNotes,
    agreeTerms,
    setAgreeTerms,
    isSubmitting,
    setIsSubmitting,
    validateForm
  };
}
