import colors from 'colors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app';
import config from './config';
import { seedSuperAdmin } from './DB/seedAdmin';
import { socketHelper } from './helpers/socketHelper';
import { errorLogger, logger } from './shared/logger';
import {
  addressConsumer,
  addressUpdateConsumer,
  kafkaConsumer,
  updateLangConsumer,
} from './handlers/kafka.consumer';
import { BulkUpdateAddress, startWorker } from './worker';

//uncaught exception
process.on('uncaughtException', error => {
  errorLogger.error('UnhandleException Detected', error);
  console.log(error.stack);

  process.exit(1);
});

let server: any;
async function main() {
  try {
    mongoose.connect(config.database_url as string);
    logger.info(colors.green('🚀 Database connected successfully'));

    //Seed Super Admin after database connection is successful
    await seedSuperAdmin();
    kafkaConsumer();
    startWorker();

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port);

    server = app.listen(port, config.ip_address as string, () => {
      logger.info(
        colors.yellow(`♻️  Application listening on port:${config.port}`)
      );
    });

    //socket
    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: '*',
      },
    });
    socketHelper.socket(io);
    //@ts-ignore
    global.io = io;
  } catch (error) {
    errorLogger.error(colors.red('🤢 Failed to connect Database'));
  }

  //handle unhandleRejection
  process.on('unhandledRejection', (reason: any) => {
    if (server) {
      server.close(() => {
        errorLogger.error('Unhandled Rejection Detected', reason);

        if (reason instanceof Error) {
          console.error(reason.stack);
        } else {
          console.error('Rejection reason (not Error):', reason);
        }

        process.exit(1);
      });
    } else {
      if (reason instanceof Error) {
        console.error(reason.stack);
      } else {
        console.error('Rejection reason (not Error):', reason);
      }

      process.exit(1);
    }
  });
}

main();

//SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM IS RECEIVE');
  if (server) {
    server.close();
  }
});
