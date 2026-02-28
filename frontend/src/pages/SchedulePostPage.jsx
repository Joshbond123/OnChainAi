import ScheduleForm from '../components/ScheduleForm';

export default function SchedulePostPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Schedule Text/Image Post</h2>
      <ScheduleForm type="post" />
    </div>
  );
}
