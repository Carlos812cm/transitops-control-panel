export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phone: string;
  email: string;
  status: DriverStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDriverRequest {
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phone: string;
  email: string;
  status: DriverStatus;
}

export interface UpdateDriverRequest extends Partial<CreateDriverRequest> {}
