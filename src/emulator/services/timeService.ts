
import { DEVICE_CLIENT } from "@deskthing/types";
import { ServerMessageBus } from "../server/serverMessageBus";

export type TimePayload = {
    utcTime: number;
    timezoneOffset: number;
};

export class TimeService {
    private intervalId: NodeJS.Timeout | null = null;

    start() {
        // Send time update every second
        this.intervalId = setInterval(() => {
            const now = new Date();
            const payload: TimePayload = {
                utcTime: now.getTime(),
                timezoneOffset: now.getTimezoneOffset()
            };

            const TimeDataPayload = { type: DEVICE_CLIENT.TIME, app: 'client', request: 'set', payload: payload }

            ServerMessageBus.publish("client:request", TimeDataPayload);
        }, 15000); // send every 15s - the server technically updated every 60s
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
