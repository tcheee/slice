import { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export default function ContextProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [coursesCreated, setCoursesCreated] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [provider, setProvider] = useState(null);
  const [FactoryAddress, setFactoryAddress] = useState(
    '0x60e09dB8212008106601646929360D20eFC4BE33'
  );
  const [ManagerAddress, setManagerAddress] = useState(
    '0x1e86fCe4d102A5924A9EF503f772fCA162Af2067'
  );

  return (
    <AppContext.Provider
      value={{
        address,
        setAddress,
        activeCourse,
        setActiveCourse,
        coursesCreated,
        setCoursesCreated,
        provider,
        setProvider,
        FactoryAddress,
        setFactoryAddress,
        ManagerAddress,
        setManagerAddress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
