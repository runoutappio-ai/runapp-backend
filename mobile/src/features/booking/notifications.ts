import * as Notifications from 'expo-notifications';
import type { Reservation } from '@/types/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function scheduleReservationReminders(reservation: Reservation) {
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return;
  const confirmedAt = reservation.confirmedReservationAt ?? reservation.reservationAt;
  const revealAt = new Date(confirmedAt).getTime();
  if (revealAt > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      identifier: `reveal-${reservation.id}`,
      content: {
        title: 'Your Run Out reveal is ready',
        body: 'Your table time has arrived. Open the envelope to discover the restaurant and menu.',
        data: { url: `/reservation/${reservation.id}` },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(revealAt) },
    });
  }
  const reminderAt = new Date(confirmedAt).getTime() - 45 * 60_000;
  if (reminderAt > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      identifier: `reservation-${reservation.id}`,
      content: { title: 'Your mystery dinner is coming up', body: 'Your table is in 45 minutes.', data: { url: `/reservation/${reservation.id}` } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminderAt) },
    });
  }
}
