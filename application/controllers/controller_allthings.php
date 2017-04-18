<?php

/**
 * Created by PhpStorm.
 * User: Sergey
 * Date: 10.11.2016
 * Time: 23:26
 */
class Controller_allthings extends Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->model=new Model_allthings();
    }

    function index($param=null)
    {
        // TODO: Implement action_index() method.
        $request_method=$_SERVER['REQUEST_METHOD'];
        switch ($request_method){
            case "GET":
                $this->get();
                break;
            case "POST":
                $this->post();
                break;
        }
    }
    function get(){
        $data=$this->model->get();
        $this->view->generate('allthings_view.php', 'template_allthings_view.php',$data);
    }
    function post(){
        $data=$_POST['new_thing'];
        $result=$this->model->post($data);
        if ($result!=null) echo "Success-".$result;
        else echo " Fail to create thing!!!";
    }
}