<template>
    <div id="app">
        <div xData="x">Hello {{ name }}!</div>
    </div>
</template>

<script>
export default {
    name: 'app',
    data () {
        console.log('data');
        return {
            name: 'World'
        }
   }
}
</script>

<style>
#app {
    color: #000
}
</style>
