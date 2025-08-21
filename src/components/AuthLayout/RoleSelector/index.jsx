import React, { useState } from 'react';
import { getStorage } from '../../../utils/commonfunction';

const RoleSelector = ({selectedRole, setSelectedRole, handleRoleSelect}) => {

  const user = getStorage('user', true);

  // console.log('user roles compo',user);
  // console.log('selectedRole roles compo',selectedRole);

  // const roles = [
  //   { value: 'accountExecutive', label: 'Account Executive' },
  //   { value: 'contractProcessor', label: 'Contract Processor' },
  //   { value: 'realEstateAgent', label: 'Real Estate Agent' },
  //   { value: 'loanOfficer', label: 'Loan Officer' },
  // ];



  return (
    <div className="bg-gray-900 rounded-lg text-white max-w-2xl">
      {/* <h2 className="text-gray-400 text-xl mb-6">Select Your Role</h2> */}

      <div className="grid grid-cols-1 gap-4">
        {user?.user?.roles?.map(role => (
          <div
            key={role?.name}
            className={`
              border rounded-lg p-4 relative cursor-pointer flex justify-between items-center
              ${selectedRole?.name === role?.name
                ? 'bg-primaryOpacity border-primary text-primary'
                : 'border-[#373737] hover:border-gray-500 bg-gray'}
            `}
            onClick={() => handleRoleSelect(role)}
          >
            <span className="text-lg">{role?.full_name}</span>
            {
              selectedRole?.name === role?.name ?
                <i className="icon-verification before:!m-0 text-primary text-2xl " />
                : null
            }

            {/* {selectedRole === role.value && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500">
                <Check className="text-white" size={16} />
              </div>
            )} */}

            <input
              type="radio"
              name="roleSelector"
              value={role?.name}
              checked={selectedRole?.name === role?.name}
              onChange={() => handleRoleSelect(role)}
              className="opacity-0 absolute"
              aria-label={role.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;