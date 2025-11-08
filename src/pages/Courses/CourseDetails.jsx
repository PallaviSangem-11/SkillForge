import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { useAuth } from '../../auth/useAuth';
import { toast } from 'react-toastify';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentCount, setEnrollmentCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        // backend doesn't expose GET /api/courses/{id}, fetch all and find the one
        const res = await api.get('/courses');
        const all = res.data || [];
        const found = all.find(c => String(c.id) === String(id));
        if (!found) {
          toast.error('Course not found');
          navigate(-1);
          return;
        }
        setCourse(found);

        try {
          const countRes = await api.get(`/enrollments/course/${found.id}/count`);
          setEnrollmentCount(countRes.data || 0);
        } catch (e) {
          setEnrollmentCount(0);
        }
      } catch (error) {
        console.error('Error loading course details', error);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please login to enroll');
      navigate('/login');
      return;
    }

    try {
      await api.post(`/enrollments/enroll?courseId=${course.id}&studentId=${user.id}`);
      toast.success('Enrolled successfully');
      setEnrollmentCount(prev => prev + 1);
    } catch (error) {
      console.error('Enroll error', error);
      toast.error('Failed to enroll');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!course) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
      <p className="text-gray-600 mb-4">{course.description}</p>
      <div className="mb-4">
        <span className="mr-4">Difficulty: {course.difficultyLevel}</span>
        <span>Enrolled: {enrollmentCount} students</span>
      </div>
      <div className="flex gap-3">
        <button onClick={handleEnroll} className="bg-green-600 text-white px-4 py-2 rounded">Enroll Now</button>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded border">Back</button>
      </div>
    </div>
  );
};

export default CourseDetails;
