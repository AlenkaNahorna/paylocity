<template>
  <v-sheet class="mx-auto" border>
    <EmployeesTable />
  </v-sheet>
</template>

<script>
import EmployeesTable from './components/EmployeesTable.vue'

export default {
  components: {
    EmployeesTable
  }
}
</script>
