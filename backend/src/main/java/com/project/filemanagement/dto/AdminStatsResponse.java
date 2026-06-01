package com.project.filemanagement.dto;

public class AdminStatsResponse {

    private long totalUsers;
    private long totalAdmins;
    private long totalRegularUsers;

    public AdminStatsResponse() {
    }

    public AdminStatsResponse(
            long totalUsers,
            long totalAdmins,
            long totalRegularUsers) {

        this.totalUsers = totalUsers;
        this.totalAdmins = totalAdmins;
        this.totalRegularUsers = totalRegularUsers;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }

    public long getTotalRegularUsers() {
        return totalRegularUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public void setTotalAdmins(long totalAdmins) {
        this.totalAdmins = totalAdmins;
    }

    public void setTotalRegularUsers(long totalRegularUsers) {
        this.totalRegularUsers = totalRegularUsers;
    }
}