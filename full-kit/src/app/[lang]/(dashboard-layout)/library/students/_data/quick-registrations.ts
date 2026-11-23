export interface NewRegistrationStudent {
  id: string
  name: string
  phone: string
  email: string
  avatar: string
  plan: string
  shift: string
  preferredSeat: string
  registeredAt: string
  feeStatus: "Paid" | "Pending"
  status: "Pending Approval" | "Approved" | "Rejected"
}

export const initialNewRegistrations: NewRegistrationStudent[] = [
  {
    id: "REG-2041",
    name: "Kabir Mehta",
    phone: "+91 98112 34567",
    email: "kabir.mehta@gmail.com",
    avatar: "/images/avatars/male-01.svg",
    plan: "UPSC 6-Month Pass",
    shift: "Full Day (8 AM - 10 PM)",
    preferredSeat: "Seat A-14",
    registeredAt: "8 mins ago",
    feeStatus: "Paid",
    status: "Pending Approval",
  },
  {
    id: "REG-2042",
    name: "Pooja Sharma",
    phone: "+91 98765 87654",
    email: "pooja.sharma@gmail.com",
    avatar: "/images/avatars/female-02.svg",
    plan: "NEET 1-Year Pass",
    shift: "Morning (8 AM - 2 PM)",
    preferredSeat: "Seat B-08",
    registeredAt: "24 mins ago",
    feeStatus: "Paid",
    status: "Pending Approval",
  },
  {
    id: "REG-2043",
    name: "Tanvi Desai",
    phone: "+91 99234 56781",
    email: "tanvi.desai@gmail.com",
    avatar: "/images/avatars/female-03.svg",
    plan: "CA Final Intensive",
    shift: "Evening (2 PM - 8 PM)",
    preferredSeat: "Seat C-05",
    registeredAt: "1 hour ago",
    feeStatus: "Pending",
    status: "Pending Approval",
  },
  {
    id: "REG-2044",
    name: "Aayush Verma",
    phone: "+91 98450 11223",
    email: "aayush.verma@gmail.com",
    avatar: "/images/avatars/male-03.svg",
    plan: "Banking & SSC Prep",
    shift: "Full Day (8 AM - 10 PM)",
    preferredSeat: "Unassigned",
    registeredAt: "2 hours ago",
    feeStatus: "Pending",
    status: "Pending Approval",
  },
]
