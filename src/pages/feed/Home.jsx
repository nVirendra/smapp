import React, { useState, useEffect } from 'react';
import Feed from '../../components/post/Feed';
import SearchSidebar from '../search/Search';
import { fetchUsers } from '../../services/user.service';
import MainLayout from '../../layouts/MainLayout';
import LeftSidebar from '../../components/layout/Sidebar';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchQuery).then((res) => {
        setUsers(res.result || []);
      });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <MainLayout mainClassName="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <LeftSidebar />

      <section className="lg:col-span-6 space-y-6">
        <Feed />
      </section>

      <SearchSidebar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        users={users}
      />
    </MainLayout>
  );
};

export default Home;
