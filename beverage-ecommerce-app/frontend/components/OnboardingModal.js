import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const steps = [
  {
    title: 'Welcome to BeverageHub!',
    content: 'Order your favorite drinks and have them delivered to your door. Let’s take a quick tour!'
  },
  {
    title: 'Browse & Search',
    content: 'Use the search bar and category tabs to find your favorite beverages quickly.'
  },
  {
    title: 'Add to Cart',
    content: 'Select sizes or packets, adjust quantities, and add items to your cart.'
  },
  {
    title: 'Checkout & Pay',
    content: 'Proceed to checkout, pay securely, and track your orders in real time.'
  },
  {
    title: 'Wallet & Orders',
    content: 'Access your wallet and order history from the menu after logging in.'
  }
];

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('onboarded')) {
      setOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setOpen(false);
      localStorage.setItem('onboarded', 'true');
    }
  };

  const handleSkip = () => {
    setOpen(false);
    localStorage.setItem('onboarded', 'true');
  };

  return (
    <Dialog open={open} onClose={handleSkip} maxWidth="xs" fullWidth>
      <DialogTitle>{steps[step].title}</DialogTitle>
      <DialogContent>
        <Typography>{steps[step].content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSkip}>Skip</Button>
        <Button onClick={handleNext} variant="contained">
          {step === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
