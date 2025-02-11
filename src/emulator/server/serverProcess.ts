import { pathToFileURL } from "url";

const serverPath = process.env.SERVER_INDEX_PATH;
if (!serverPath) {
  throw new Error('SERVER_INDEX_PATH is not defined!');
}

const serverUrl = pathToFileURL(serverPath).href;

process.send?.({ type: 'server:log', payload: `Starting up... ${serverUrl}` });

// keep alive
process.on('SIGTERM', () => {
  process.exit(0)
})

const importDeskThing = async () => {
  const { DeskThing } = await import(serverUrl);
  process.send?.({ type: 'server:log', payload: 'DeskThing module loaded successfully.' });

  // Handle messages from parent process
  process.on('message', (message: any) => {
    if (message.type === 'app:data') {
      handleAppRequest(message.payload);
    }
  });

  DeskThing.start({
    toServer: (payload: any) => {
      process.send?.({ type: 'server:data', payload }); // Send data to parent
    },
    SysEvents: (_event: any, _listener: any) => {
      return () => {};
    },
  });

  async function handleAppRequest(data: any) {
    await DeskThing.toClient(data);
    process.send?.({ type: 'server:log', payload: `Handled request: ${JSON.stringify(data)}` });
  }
};

importDeskThing().catch((err) => {
  console.log('Err in serverProcess: ', err)
  process.send?.({ type: 'server:log', payload: `Failed to load DeskThing: ${err.message}` });
  process.exit(1)
});
