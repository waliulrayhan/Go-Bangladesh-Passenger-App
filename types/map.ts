// Map-related type definitions for the Go Bangladesh Passenger App

export interface Organization {
  id: string;
  name: string;
  code: string;
  organizationType: 'Public' | 'Private';
}

export interface Route {
  value: string;
  label: string;
}

export interface Bus {
  id: string;
  busNumber: string;
  busName: string;
  organizationName: string | null;
  presentLatitude: string;
  presentLongitude: string;
}

export interface MapDropdown {
  isOpen: boolean;
  selectedValue: string | null;
  selectedLabel: string | null;
}

export interface MapSearchParams {
  organizationId: string;
  organizationName: string;
  routeId?: string;
  routeName?: string;
}

export interface UserJWTPayload {
  UserId?: string;
  Name?: string;
  UserType?: 'Public' | 'Private';
  OrganizationId?: string;
  OrganizationName?: string;
  unique_name?: string;
  exp?: number;
  iat?: number;
}

// API Response types for map endpoints
export interface OrganizationApiResponse {
  data: {
    isSuccess: boolean;
    content: Organization[];
    timeStamp: string;
    payloadType: 'Organization';
    message: string;
  };
}

export interface RouteApiResponse {
  data: {
    isSuccess: boolean;
    content: Route[];
    timeStamp: string;
    payloadType: 'Route';
    message: string;
  };
}

export interface BusApiResponse {
  data: {
    isSuccess: boolean;
    content: Bus[];
    timeStamp: string;
    payloadType: 'Bus';
    message: string;
  };
}
