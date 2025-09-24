import React, { useEffect, useState } from 'react';

export default function PersonalGreeting({ user }) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    let greet = 'Hello';
    if (hour < 12) greet = 'Good morning';
    else if (hour < 18) greet = 'Good afternoon';
    else greet = 'Good evening';
    setGreeting(greet);
  }, []);

  if (!user) return null;

  return (
    <span style={{ fontWeight: 600 }}>
      {greeting}, {user.name?.split(' ')[0] || 'User'}!
    </span>
  );
}
