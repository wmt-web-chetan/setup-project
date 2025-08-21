export const setStorage = (name, value, days = 7) => {
  try {
    // Calculate expiry time
    const expiry = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).getTime()
      : null;

    // Create storage object
    const item = {
      value: value,
      expiry: expiry,
    };

    // If value is an object, it will be handled by JSON.stringify below
    localStorage.setItem(name, JSON.stringify(item));
  } catch (error) {
    console.error("Error setting localStorage item:", error);
  }
};

export const getStorage = (name, isJson = false) => {
  try {
    const itemStr = localStorage.getItem(name);

    // Return null if item doesn't exist
    if (!itemStr) {
      return null;
    }

    // Parse the item
    const item = JSON.parse(itemStr);

    // Check if the item is expired
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(name);
      return null;
    }

    // Return value based on isJson flag
    const value = item.value;

    if (isJson && typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }

    return value;
  } catch (error) {
    console.error("Error getting localStorage item:", error);
    return null;
  }
};

export const removeStorage = (name) => {
  try {
    localStorage.removeItem(name);
  } catch (error) {
    console.error("Error removing localStorage item:", error);
  }
};

export const clearStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

// Function to format phone number as "215 456-7890"
export const formatPhoneNumber = (value) => {
  if (!value) return value;

  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, "");

  // Apply formatting based on length
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
  } else {
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(
      3,
      6
    )}-${phoneNumber.slice(6, 10)}`;
  }
};

export const formatPhoneNumberWithOne = (phoneNumber) => {
  if (!phoneNumber) return "";

  // Remove all non-digit characters
  let digits = phoneNumber.replace(/\D/g, "");

  // Check if country code is present
  if (digits.length > 10) {
    // If the number has 11 digits and starts with 1, it already has the country code
    if (digits.length === 11 && digits.startsWith("1")) {
      // Keep the country code and the 10 digits after it
    } else {
      // Just take the last 10 digits if there are more than 11 digits
      digits = digits.slice(-10);
      // Add country code
      digits = "1" + digits;
    }
  } else if (digits.length === 10) {
    // If there are exactly 10 digits, add the country code
    digits = "1" + digits;
  } else {
    // Return original if the input doesn't have enough digits
    return phoneNumber;
  }

  // Format the number as "+1 234 432-3423"
  return `+${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(
    4,
    7
  )}-${digits.slice(7)}`;
};

// Custom validator for phone number
export const validatePhoneNumber = (_, value) => {
  // Strip formatting to check digit count
  const digits = value ? value.replace(/\D/g, "") : "";

  if (!value) {
    return Promise.reject("Please enter your contact number!");
  }

  if (digits.length !== 10) {
    return Promise.reject("Please enter a valid 10-digit phone number!");
  }

  return Promise.resolve();
};

// Normalize function to handle input changes
export const normalizePhoneNumber = (value, prevValue) => {
  if (!value) return value;

  // Strip non-digit characters for internal value
  const phoneNumber = value.replace(/\D/g, "");

  // Limit to 10 digits
  if (phoneNumber.length > 10) {
    return prevValue;
  }

  // Return the formatted value
  return formatPhoneNumber(phoneNumber);
};

// Normalize function to handle input changes
export const normalizeNMLSNumber = (value, prevValue) => {
  if (!value) return value;

  // Strip non-digit characters for internal value
  const phoneNumber = value.replace(/\D/g, "");

  // Limit to 10 digits
  if (phoneNumber.length > 10) {
    return prevValue;
  }

  // Return the formatted value
  return phoneNumber;
};

export const normalizeOTPNumber = (value, prevValue) => {
  if (!value) return value;

  // Strip non-digit characters for internal value
  const phoneNumber = value.replace(/\D/g, "");

  // Limit to 10 digits
  if (phoneNumber.length > 1) {
    return prevValue;
  }

  // Return the formatted value
  return formatPhoneNumber(phoneNumber);
};

export function collectSlugsByRoleId(roles, selectedId) {
  // Find the role with the matching ID
  const matchingRole = roles?.find((role) => role?.id === selectedId);

  // If no matching role is found, return an empty array
  if (!matchingRole) {
    return [];
  }

  // Map through the permissions of the matching role to get the slugs
  return matchingRole?.permissions?.map((permission) => permission.slug);
}

export const trimPhoneNumber = (phone) => {
  // Check if the string starts with "+1 "
  if (phone?.startsWith("+1 ")) {
    // Remove the first 3 characters ("+1 ")
    return phone?.slice(3);
  } else {
    // Return the original string unchanged
    return phone;
  }
};

export function formatDate(isoDateString) {
  // Create a date object from the ISO string

  const date = new Date(isoDateString);

  // Array of month names (abbreviated)
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Extract day, month, and year
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  // Format the date as "DD MMM, YYYY"
  return `${day} ${month}, ${year}`;
}

function getTimezoneOffset(timezone) {
  const now = new Date();
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
  const diff = targetTime.getTime() - utc.getTime();
  const hours = Math.floor(Math.abs(diff) / 3600000);
  const minutes = Math.floor((Math.abs(diff) % 3600000) / 60000);
  const sign = diff >= 0 ? '+' : '-';
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function convertUTCToBrowserTimezone(utcTimeString, format = 'full') {
  try {
      // Get user's browser timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Parse UTC time string to Date object
      const utcDate = new Date(utcTimeString);
      
      // Check if date is valid
      if (isNaN(utcDate.getTime())) {
          throw new Error('Invalid UTC time string');
      }
      
      // Convert based on requested format
      switch (format) {
          case 'full':
              return utcDate.toLocaleString('en-US', {
                  timeZone: userTimezone,
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
              });
              
          case 'details':
              return {
                  formatted: utcDate.toLocaleString('en-US', {
                      timeZone: userTimezone,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                  }),
                  timezone: userTimezone,
                  utcInput: utcTimeString,
                  dateObject: utcDate
              };
              
          case 'date':
              return utcDate.toLocaleDateString('en-US', {
                  timeZone: userTimezone,
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
              });
              
          case 'time':
              return utcDate.toLocaleTimeString('en-US', {
                  timeZone: userTimezone,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
              });
              
          case 'iso': {
              // Get the timezone offset for ISO format
              const tempDate = new Date(utcDate.toLocaleString('en-CA', { timeZone: userTimezone }));
              return tempDate.toISOString().slice(0, -1) + getTimezoneOffset(userTimezone);
          }
              
          default:
              return utcDate.toLocaleString('en-US', { timeZone: userTimezone });
      }
      
  } catch (error) {
      console.error('Error converting UTC to browser timezone:', error);
      return null;
  }
}