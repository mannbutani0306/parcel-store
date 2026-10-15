export type UserRole = 'admin' | 'seller' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone?: string;
  sellerShopName?: string;
  address?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  blocked?: boolean;
}

export const USERS: User[] = [
  // 1 Admin
  {
    id: 'usr-admin',
    name: 'Kabir Varma',
    email: 'kabir@parcel.in',
    role: 'admin',
    avatar: '🎩',
    phone: '9811002233',
    address: {
      line1: '14 Post Office Lane, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
  },

  // 3 Sellers
  {
    id: 'sel-1',
    name: 'Oiled Oak Studio',
    email: 'press@oiledoak.in',
    role: 'seller',
    avatar: '🪵',
    sellerShopName: 'Oiled Oak Studio',
    phone: '9822334455',
    address: {
      line1: 'Sector 8 Industrial Area',
      city: 'Chandigarh',
      state: 'Punjab',
      pincode: '160019',
    },
  },
  {
    id: 'sel-2',
    name: 'Jaipur Indigo Press',
    email: 'dispatch@jaipurindigo.in',
    role: 'seller',
    avatar: '🪡',
    sellerShopName: 'Jaipur Indigo Press',
    phone: '9833445566',
    address: {
      line1: '42 Sanganer Craft Enclave',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302029',
    },
  },
  {
    id: 'sel-3',
    name: 'Deccan Mechanicals',
    email: 'craft@deccanmech.in',
    role: 'seller',
    avatar: '⚙️',
    sellerShopName: 'Deccan Mechanicals',
    phone: '9844556677',
    address: {
      line1: '88 Artillery Road, Ulsoor',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560008',
    },
  },

  // 4 Customers
  {
    id: 'usr-demo',
    name: 'Aarav Mehta',
    email: 'aarav@postbox.in',
    role: 'customer',
    avatar: '🧔🏽',
    phone: '9876543210',
    address: {
      line1: 'Flat 4B, Gulmohar Apartments, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
    },
  },
  {
    id: 'usr-2',
    name: 'Diya Sharma',
    email: 'diya.sharma@mail.in',
    role: 'customer',
    avatar: '👩🏻',
    phone: '9899112233',
    address: {
      line1: '21 Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302006',
    },
  },
  {
    id: 'usr-3',
    name: 'Rohan Sen',
    email: 'rohan.sen@calcutta.in',
    role: 'customer',
    avatar: '👨🏾',
    phone: '9831002244',
    address: {
      line1: '8B Ballygunge Circular Road',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700019',
    },
  },
  {
    id: 'usr-4',
    name: 'Ananya Rao',
    email: 'ananya.rao@mysore.in',
    role: 'customer',
    avatar: '👩🏽‍🦱',
    phone: '9845112255',
    address: {
      line1: '54 Palace View Extension',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570001',
    },
  },
];
