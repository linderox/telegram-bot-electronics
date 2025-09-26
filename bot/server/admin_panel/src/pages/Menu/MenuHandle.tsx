import { Handle, useNodeConnections } from '@xyflow/react';
 
const connectionCount = 1

const MenuHandle = (props) => {
  const connections = useNodeConnections({
    handleType: props.type,
  });
 
  return (
    <Handle
      {...props}
      isConnectable={connections.length < connectionCount}
    />
  );
};
 
export default MenuHandle;