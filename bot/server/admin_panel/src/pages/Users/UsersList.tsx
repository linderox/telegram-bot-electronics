import React from "react"
import UsersStatistics from "../../components/statistics/UserStatistics";
import PageMeta from "../../components/common/PageMeta";
import UserTable from "../../components/tables/UsersTable";

export default function UsersList() {
    return (
        <>
            <PageMeta
                title="Пользователи"
                description="Список пользователей"
            />

            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <UsersStatistics />
            </div>

            <div className="grid grid-cols-1 mt-6">
                <UserTable />
            </div>
        </>
      );
}